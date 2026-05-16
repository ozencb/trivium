import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { ConceptDefinition } from "./types";

export function loadAllConcepts(dir = path.join(process.cwd(), "concepts")): ConceptDefinition[] {
  const concepts: ConceptDefinition[] = [];
  walkDir(dir, (filePath) => {
    if (!filePath.endsWith(".yaml") && !filePath.endsWith(".yml")) return;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = yaml.load(content) as ConceptDefinition;
      concepts.push(parsed);
    } catch (e) {
      console.warn(`Skipping malformed concept file: ${filePath}`, e);
    }
  });
  return concepts;
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

export function getConceptById(concepts: ConceptDefinition[], id: string): ConceptDefinition | undefined {
  return concepts.find(c => c.id === id);
}

export function getPrerequisites(concepts: ConceptDefinition[], conceptId: string): ConceptDefinition[] {
  const concept = getConceptById(concepts, conceptId);
  if (!concept) return [];
  return concept.prerequisites
    .map(id => getConceptById(concepts, id))
    .filter((c): c is ConceptDefinition => c !== undefined);
}

export function getDependents(concepts: ConceptDefinition[], conceptId: string): ConceptDefinition[] {
  const concept = getConceptById(concepts, conceptId);
  if (!concept) return [];
  return concept.dependents
    .map(id => getConceptById(concepts, id))
    .filter((c): c is ConceptDefinition => c !== undefined);
}

export function filterConcepts(
  concepts: ConceptDefinition[],
  filters: { roles?: string[]; lenses?: string[] }
): ConceptDefinition[] {
  return concepts.filter(c => {
    if (filters.roles?.length && !c.roles.some(r => filters.roles!.includes(r))) return false;
    if (filters.lenses?.length && !c.lenses.some(l => filters.lenses!.includes(l))) return false;
    return true;
  });
}
