"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ConceptCard } from "@/components/concept-card";
import { FilterControls } from "@/components/filter-controls";
import { Button } from "@/components/ui/button";
import type { Role, Lens, ConceptStatus, ScoredConcept } from "@/lib/types";

export default function SessionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState<
    (ScoredConcept & { explanation?: string | null; isReview?: boolean }) | null
  >(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const seenRef = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roles.length) params.set("roles", roles.join(","));
      if (lenses.length) params.set("lenses", lenses.join(","));
      if (seenRef.current.size) params.set("seen", [...seenRef.current].join(","));

      const res = await fetch("/api/session/next?" + params.toString());
      if (!res.ok) throw new Error("Failed to fetch next concept");
      const data = await res.json();

      if (data.done) {
        setDone(true);
        setCurrent(null);
      } else {
        setCurrent(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [roles, lenses]);

  useEffect(() => {
    if (started) fetchNext();
  }, [started, fetchNext]);

  async function handleSaveProgress(status: ConceptStatus) {
    if (!current) return;
    try {
      const res = await fetch("/api/concepts/" + current.id + "/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to save progress");
    } catch {
      setError(
        "Failed to save progress — your selection may not have been recorded",
      );
    }
  }

  function handleAdvance() {
    if (current) seenRef.current.add(current.id);
    setReviewed((r) => r + 1);
    fetchNext();
  }

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <h1 className="text-lg font-semibold tracking-tight mb-1">
          Study Session
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Filter by role and lens, or leave empty for all concepts.
        </p>
        <FilterControls
          selectedRoles={roles}
          selectedLenses={lenses}
          onRolesChange={setRoles}
          onLensesChange={setLenses}
        />
        <Button className="mt-6" onClick={() => setStarted(true)}>
          Start Session
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground">loading...</p>
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="max-w-xl mx-auto py-10 px-6">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={() => fetchNext()}>
          Retry
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-10 px-6">
        <h2 className="text-lg font-semibold mb-2">Session Complete</h2>
        <p className="text-sm text-muted-foreground mb-1">
          You&apos;ve reviewed all available concepts.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {reviewed} reviewed this session.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setStarted(false);
            setDone(false);
            setReviewed(0);
            seenRef.current = new Set();
          }}
        >
          New Session
        </Button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="py-10 px-6">
      <div className="max-w-xl mx-auto mb-4">
        <p className="text-xs text-muted-foreground tabular-nums">
          {reviewed} reviewed this session
        </p>
      </div>
      {error && (
        <div className="max-w-xl mx-auto mb-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <ConceptCard
        concept={current}
        isReview={current.isReview}
        onSaveProgress={handleSaveProgress}
        onAdvance={handleAdvance}
      />
    </div>
  );
}
