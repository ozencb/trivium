"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roles.length) params.set("roles", roles.join(","));
      if (lenses.length) params.set("lenses", lenses.join(","));

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
    setReviewed((r) => r + 1);
    fetchNext();
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="text-xl font-bold tracking-tight mb-1">Study Session</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Filter by role and lens, or leave empty for all concepts.
        </p>
        <FilterControls
          selectedRoles={roles}
          selectedLenses={lenses}
          onRolesChange={setRoles}
          onLensesChange={setLenses}
        />
        <Button className="mt-8" size="lg" onClick={() => setStarted(true)}>
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
      <div className="max-w-xl mx-auto py-16 px-4">
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={() => fetchNext()}>
          Retry
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <h2 className="text-xl font-bold mb-2">Session Complete</h2>
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
          }}
        >
          New Session
        </Button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
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
