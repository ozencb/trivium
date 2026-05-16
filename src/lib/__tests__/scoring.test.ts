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

describe("scoreConcepts", () => {
  it("ranks concepts with more dependents higher", () => {
    const concepts = [
      makeConcept({ id: "a", dependents: ["b", "c", "d"] }),
      makeConcept({ id: "b", dependents: [] }),
      makeConcept({ id: "c", dependents: ["d"] }),
      makeConcept({ id: "d", dependents: [] }),
    ];
    const progress: Record<string, ConceptStatus> = {};
    const scored = scoreConcepts(concepts, progress);
    expect(scored[0].id).toBe("a");
  });

  it("prioritizes concepts whose prerequisites are known", () => {
    const concepts = [
      makeConcept({ id: "a", prerequisites: ["x"], dependents: [] }),
      makeConcept({ id: "b", prerequisites: ["y"], dependents: [] }),
      makeConcept({ id: "x", dependents: ["a"] }),
      makeConcept({ id: "y", dependents: ["b"] }),
    ];
    const progress: Record<string, ConceptStatus> = { x: "known" };
    const scored = scoreConcepts(concepts, progress);
    const filtered = scored.filter(c => c.id === "a" || c.id === "b");
    expect(filtered[0].id).toBe("a");
  });

  it("excludes concepts already marked known", () => {
    const concepts = [
      makeConcept({ id: "a" }),
      makeConcept({ id: "b" }),
    ];
    const progress: Record<string, ConceptStatus> = { a: "known" };
    const scored = scoreConcepts(concepts, progress);
    expect(scored.map(c => c.id)).not.toContain("a");
  });

  it("deprioritizes concepts with low prerequisite readiness", () => {
    const concepts = [
      makeConcept({ id: "a", prerequisites: ["x", "y", "z"], dependents: ["d1", "d2", "d3"] }),
      makeConcept({ id: "b", prerequisites: [], dependents: ["d1"] }),
    ];
    const progress: Record<string, ConceptStatus> = {};
    const scored = scoreConcepts(concepts, progress);
    expect(scored[0].id).toBe("b");
  });
});
