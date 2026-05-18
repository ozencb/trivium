"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3Force from "d3-force";
import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import * as d3Drag from "d3-drag";
import type { ConceptWithState, ConceptStatus } from "@/lib/types";

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  title: string;
  category: string[];
  status: ConceptStatus;
  brief: string;
}

interface GraphLink extends d3Force.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const STATUS_COLORS: Record<ConceptStatus, string> = {
  known: "#34d399",
  vaguely_known: "#fbbf24",
  unknown: "#60a5fa",
  unseen: "#6b7280",
};

const CATEGORY_POSITIONS: Record<string, { x: number; y: number }> = {};

function getCategoryPosition(category: string, width: number, height: number) {
  if (!CATEGORY_POSITIONS[category]) {
    const angle =
      Object.keys(CATEGORY_POSITIONS).length * ((2 * Math.PI) / 16);
    CATEGORY_POSITIONS[category] = {
      x: width / 2 + Math.cos(angle) * (width * 0.25),
      y: height / 2 + Math.sin(angle) * (height * 0.25),
    };
  }
  return CATEGORY_POSITIONS[category];
}

export function ConceptGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [concepts, setConcepts] = useState<ConceptWithState[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(),
  );
  const [popover, setPopover] = useState<GraphNode | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    fetch("/api/concepts")
      .then((res) => res.json())
      .then((data: ConceptWithState[]) => {
        setConcepts(data);
        const cats = [...new Set(data.flatMap((c) => c.category))];
        setCategories(cats);
        setActiveCategories(new Set(cats));
      });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current || concepts.length === 0) return;

    const svg = d3Selection.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const filtered = concepts.filter((c) =>
      c.category.some((cat) => activeCategories.has(cat)),
    );

    const nodeIds = new Set(filtered.map((c) => c.id));
    const nodes: GraphNode[] = filtered.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      status: c.status,
      brief: c.brief,
    }));

    const links: GraphLink[] = [];
    for (const c of filtered) {
      for (const dep of c.dependents) {
        if (nodeIds.has(dep)) {
          links.push({ source: c.id, target: dep });
        }
      }
    }

    const simulation = d3Force
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3Force
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3Force.forceManyBody().strength(-120))
      .force("center", d3Force.forceCenter(width / 2, height / 2))
      .force("collide", d3Force.forceCollide(20))
      .force(
        "x",
        d3Force
          .forceX<GraphNode>(
            (d) => getCategoryPosition(d.category[0], width, height).x,
          )
          .strength(0.1),
      )
      .force(
        "y",
        d3Force
          .forceY<GraphNode>(
            (d) => getCategoryPosition(d.category[0], width, height).y,
          )
          .strength(0.1),
      );

    const g = svg.append("g");

    const zoom = d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4b5563");

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrowhead)");

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d) => STATUS_COLORS[d.status])
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        setPopover(d);
      });

    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.title)
      .attr("font-size", 9)
      .attr("fill", "#9ca3af")
      .attr("dx", 12)
      .attr("dy", 3)
      .attr("pointer-events", "none");

    const drag = d3Drag
      .drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.call(drag as any);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);
      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [concepts, activeCategories]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex items-center border-b border-border bg-card/50">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 px-4 py-2.5 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`text-[11px] px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                  activeCategories.has(cat)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="relative shrink-0 border-l border-border">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="flex items-center gap-1 px-3 py-2.5 md:hidden"
            aria-label="Toggle legend"
          >
            {Object.values(STATUS_COLORS).map((color) => (
              <span
                key={color}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </button>
          {legendOpen && (
            <div className="absolute right-0 top-full z-10 flex flex-col gap-2 px-4 py-3 bg-card border border-border rounded-b-lg shadow-lg md:hidden">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <span
                  key={status}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {status.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
          <div className="hidden md:flex items-center gap-3 px-4 py-2.5">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span
                key={status}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {status.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />

        {popover && (
          <div className="absolute top-4 right-4 w-72 bg-popover border border-border rounded-lg p-4 shadow-lg">
            <button
              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground text-xs"
              onClick={() => setPopover(null)}
            >
              x
            </button>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              {popover.category.join(" / ")}
            </p>
            <h3 className="text-sm font-bold mb-1">{popover.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {popover.brief}
            </p>
            <span
              className="inline-block text-[10px] font-medium rounded px-1.5 py-0.5"
              style={{
                backgroundColor: STATUS_COLORS[popover.status] + "33",
                color: STATUS_COLORS[popover.status],
              }}
            >
              {popover.status.replace("_", " ")}
            </span>
            <div className="mt-3 flex gap-1.5">
              <StatusButton
                conceptId={popover.id}
                status="known"
                label="Known"
                onUpdate={(s) => updateNodeStatus(popover.id, s)}
              />
              <StatusButton
                conceptId={popover.id}
                status="vaguely_known"
                label="Vague"
                onUpdate={(s) => updateNodeStatus(popover.id, s)}
              />
              <StatusButton
                conceptId={popover.id}
                status="unknown"
                label="Unknown"
                onUpdate={(s) => updateNodeStatus(popover.id, s)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function updateNodeStatus(conceptId: string, status: ConceptStatus) {
    setConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, status } : c)),
    );
    setPopover((prev) =>
      prev && prev.id === conceptId ? { ...prev, status } : prev,
    );
  }
}

function StatusButton({
  conceptId,
  status,
  label,
  onUpdate,
}: {
  conceptId: string;
  status: ConceptStatus;
  label: string;
  onUpdate: (status: ConceptStatus) => void;
}) {
  async function handleClick() {
    await fetch(`/api/concepts/${conceptId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onUpdate(status);
  }

  return (
    <button
      onClick={handleClick}
      className="text-[10px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {label}
    </button>
  );
}
