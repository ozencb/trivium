// scripts/prompt-template.ts
import crypto from "crypto";
import type { ConceptDefinition } from "../src/lib/types";

const TEMPLATE = `You are explaining "{title}" to a software engineer with ~7 years of experience.

Context: This concept belongs to {category}.
Prerequisites the reader already understands: {prerequisites}.
This concept unlocks understanding of: {dependents}.

Write an explanation that:
- Starts with a 1-2 sentence "what and why" summary
- Explains the core mechanism/idea (not surface-level)
- Gives a concrete example or mental model
- Connects it to practical scenarios for: {roles}
- Is 300-500 words

Do not be condescending. Assume the reader is smart but hasn't encountered this specific topic deeply.`;

export function buildPrompt(concept: ConceptDefinition, allConcepts: ConceptDefinition[]): string {
  const prereqTitles = concept.prerequisites
    .map(id => allConcepts.find(c => c.id === id)?.title ?? id)
    .join(", ") || "None";
  const depTitles = concept.dependents
    .map(id => allConcepts.find(c => c.id === id)?.title ?? id)
    .join(", ") || "None";

  return TEMPLATE
    .replace("{title}", concept.title)
    .replace("{category}", concept.category.join(" > "))
    .replace("{prerequisites}", prereqTitles)
    .replace("{dependents}", depTitles)
    .replace("{roles}", concept.roles.join(", "));
}

export function getPromptVersion(): string {
  const hash = crypto.createHash("sha256").update(TEMPLATE).digest("hex");
  return hash.slice(0, 12);
}
