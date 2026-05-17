// scripts/prompt-template.ts
import crypto from "crypto";
import type { ConceptDefinition } from "../src/lib/types";

const TEMPLATE = `You are explaining "{title}" to a software engineer with ~7 years of experience.

In one sentence: {brief}

Context: This concept belongs to {category}.
Perspective: {lensGuidance}
Prerequisites the reader already understands: {prerequisites}.
This concept unlocks understanding of: {dependents}.

Write an explanation that:
- Starts with a 1-2 sentence "what and why" summary
- Explains the core mechanism/idea (not surface-level)
- Gives a concrete example or mental model
- Connects it to practical scenarios for: {roles}
- Is 300-500 words

Do not be condescending. Assume the reader is smart but hasn't encountered this specific topic deeply.`;

const LENS_GUIDANCE: Record<string, string> = {
  foundational: "Emphasize the underlying theory, mechanism, and invariants.",
  practical: "Emphasize real-world patterns, common pitfalls, and when to reach for this.",
  career: "Emphasize how this knowledge differentiates senior engineers in design discussions and interviews.",
};

function buildLensGuidance(lenses: string[]): string {
  return lenses.map(l => LENS_GUIDANCE[l]).filter(Boolean).join(" ");
}

export function buildPrompt(concept: ConceptDefinition, allConcepts: ConceptDefinition[]): string {
  const prereqTitles = concept.prerequisites
    .map(id => allConcepts.find(c => c.id === id)?.title ?? id)
    .join(", ") || "None";
  const depTitles = concept.dependents
    .map(id => allConcepts.find(c => c.id === id)?.title ?? id)
    .join(", ") || "None";

  return TEMPLATE
    .replace("{title}", concept.title)
    .replace("{brief}", concept.brief)
    .replace("{category}", concept.category.join(" > "))
    .replace("{lensGuidance}", buildLensGuidance(concept.lenses))
    .replace("{prerequisites}", prereqTitles)
    .replace("{dependents}", depTitles)
    .replace("{roles}", concept.roles.join(", "));
}

export function getPromptVersion(): string {
  const hash = crypto.createHash("sha256").update(TEMPLATE).digest("hex");
  return hash.slice(0, 12);
}
