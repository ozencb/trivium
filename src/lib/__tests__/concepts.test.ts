import { describe, it, expect } from "vitest";
import { loadAllConcepts, getConceptById, getPrerequisites, getDependents } from "../concepts";

describe("loadAllConcepts", () => {
  it("loads yaml files from concepts directory", () => {
    const concepts = loadAllConcepts("concepts");
    expect(concepts.length).toBeGreaterThanOrEqual(3);
    const ids = concepts.map(c => c.id);
    expect(ids).toContain("tcp-basics");
    expect(ids).toContain("tcp-congestion-control");
  });

  it("parses concept fields correctly", () => {
    const concepts = loadAllConcepts("concepts");
    const tcp = concepts.find(c => c.id === "tcp-basics")!;
    expect(tcp.title).toBe("TCP Basics");
    expect(tcp.category).toEqual(["Networking", "TCP/IP"]);
    expect(tcp.roles).toContain("backend");
    expect(tcp.lenses).toContain("foundational");
    expect(tcp.prerequisites).toEqual([]);
    expect(tcp.dependents).toContain("tcp-congestion-control");
  });
});

describe("getConceptById", () => {
  it("returns concept by id", () => {
    const concepts = loadAllConcepts("concepts");
    const result = getConceptById(concepts, "tcp-basics");
    expect(result!.title).toBe("TCP Basics");
  });

  it("returns undefined for unknown id", () => {
    const concepts = loadAllConcepts("concepts");
    const result = getConceptById(concepts, "nonexistent");
    expect(result).toBeUndefined();
  });
});

describe("graph traversal", () => {
  it("getPrerequisites returns prerequisite concepts", () => {
    const concepts = loadAllConcepts("concepts");
    const prereqs = getPrerequisites(concepts, "tcp-congestion-control");
    expect(prereqs.map(c => c.id)).toContain("tcp-basics");
  });

  it("getDependents returns dependent concepts", () => {
    const concepts = loadAllConcepts("concepts");
    const deps = getDependents(concepts, "tcp-basics");
    expect(deps.map(c => c.id)).toContain("tcp-congestion-control");
  });
});
