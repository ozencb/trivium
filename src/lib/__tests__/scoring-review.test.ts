import { describe, it, expect } from "vitest";
import { scoreConcepts } from "../scoring";
import type { ConceptDefinition, ConceptStatus } from "../types";

const makeConcept = (overrides: Partial<ConceptDefinition>): ConceptDefinition => ({
  id: "test",
  title: "Test",
  category: ["Test"],
  roles: ["backend"],
  lenses: ["foundational"],
  prerequisites: [],
  dependents: [],
  brief: "Test concept",
  ...overrides,
});

describe("scoreConcepts with reviews", () => {
  it("includes known concepts that are due for review", () => {
    const concepts = [
      makeConcept({ id: "a" }),
      makeConcept({ id: "b" }),
    ];
    const progress: Record<string, ConceptStatus> = { a: "known", b: "unknown" };
    const reviews = { a: "2020-01-01" };

    const scored = scoreConcepts(concepts, progress, reviews);
    expect(scored.map(c => c.id)).toContain("a");
  });

  it("does not include known concepts that are not due", () => {
    const concepts = [
      makeConcept({ id: "a" }),
      makeConcept({ id: "b" }),
    ];
    const progress: Record<string, ConceptStatus> = { a: "known", b: "unknown" };
    const reviews = { a: "2099-01-01" };

    const scored = scoreConcepts(concepts, progress, reviews);
    expect(scored.map(c => c.id)).not.toContain("a");
  });

  it("boosts due reviews to appear near the top", () => {
    const concepts = [
      makeConcept({ id: "review-me", dependents: [] }),
      makeConcept({ id: "new-one", dependents: ["x", "y"] }),
    ];
    const progress: Record<string, ConceptStatus> = { "review-me": "known" };
    const reviews = { "review-me": "2020-01-01" };

    const scored = scoreConcepts(concepts, progress, reviews);
    expect(scored[0].id).toBe("review-me");
  });

  it("marks due review concepts with isReview=true", () => {
    const concepts = [makeConcept({ id: "a" })];
    const progress: Record<string, ConceptStatus> = { a: "known" };
    const reviews = { a: "2020-01-01" };

    const scored = scoreConcepts(concepts, progress, reviews);
    expect(scored[0].isReview).toBe(true);
  });

  it("marks non-review concepts with isReview=false", () => {
    const concepts = [makeConcept({ id: "a" })];
    const progress: Record<string, ConceptStatus> = {};
    const reviews = {};

    const scored = scoreConcepts(concepts, progress, reviews);
    expect(scored[0].isReview).toBe(false);
  });
});
