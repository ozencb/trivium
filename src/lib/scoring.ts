import type { ConceptDefinition, ConceptStatus, ScoredConcept } from "./types";

export function scoreConcepts(
  concepts: ConceptDefinition[],
  progress: Record<string, ConceptStatus>,
  reviews: Record<string, string | null> = {}
): ScoredConcept[] {
  const today = new Date().toISOString().split("T")[0];

  const eligible = concepts.filter(c => {
    if (progress[c.id] !== "known") return true;
    const reviewDate = reviews[c.id];
    return reviewDate != null && reviewDate <= today;
  });

  const maxDepth = computeMaxDepth(concepts);

  const scored = eligible.map(concept => {
    const isReview = progress[concept.id] === "known" && reviews[concept.id] != null && reviews[concept.id]! <= today;
    const unlockCount = concept.dependents.length;
    const depth = computeDepth(concepts, concept.id);
    const depthPenalty = maxDepth > 0 ? depth / maxDepth : 0;
    const prereqReadiness = computePrereqReadiness(concept, progress);
    const reviewBoost = isReview ? 10 : 0;

    const score = (unlockCount * 3) + (depthPenalty * -1) + (prereqReadiness * 6) + reviewBoost;

    return {
      ...concept,
      status: progress[concept.id] || ("unseen" as ConceptStatus),
      score,
      isReview,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function computeDepth(concepts: ConceptDefinition[], id: string, visited = new Set<string>()): number {
  if (visited.has(id)) return 0;
  visited.add(id);
  const concept = concepts.find(c => c.id === id);
  if (!concept || concept.prerequisites.length === 0) return 0;
  const depths = concept.prerequisites.map(pId => computeDepth(concepts, pId, visited) + 1);
  return Math.max(...depths);
}

function computeMaxDepth(concepts: ConceptDefinition[]): number {
  let max = 0;
  for (const c of concepts) {
    const d = computeDepth(concepts, c.id);
    if (d > max) max = d;
  }
  return max;
}

function computePrereqReadiness(concept: ConceptDefinition, progress: Record<string, ConceptStatus>): number {
  if (concept.prerequisites.length === 0) return 1;
  const knownCount = concept.prerequisites.filter(id => progress[id] === "known").length;
  return knownCount / concept.prerequisites.length;
}
