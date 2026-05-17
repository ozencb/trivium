// scripts/generate-concepts.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadAllConcepts } from "../src/lib/concepts";
import { callClaude } from "./claude";

const CATEGORY_PROMPT = `You are helping build a knowledge graph of software engineering concepts.

Existing concepts in the graph:
{existing}

Generate {count} NEW concepts for the category "{category}" that do NOT already exist in the graph above.

For each concept, output a YAML document separated by "---". Each must have:
- id: kebab-case unique identifier
- title: human-readable name
- category: array like ["Top Category", "Subcategory"]
- roles: subset of [backend, frontend, sre, fullstack, devops, data]
- lenses: subset of [foundational, practical, career]
- prerequisites: array of concept IDs (use existing IDs from above when applicable, or IDs of other new concepts you're generating)
- dependents: array of concept IDs that this unlocks (use existing IDs or new ones)
- brief: one sentence explaining what this concept is (aim for "how" or "why", not just "what")

Rules:
- Connect to the existing graph — reference existing concept IDs in prerequisites/dependents where it makes sense
- Target concepts a senior engineer might have gaps in — not beginner stuff
- Keep briefs concise and action-oriented
- Make sure IDs are unique and not already in the existing set

Output ONLY the YAML documents, no markdown fences, no extra text.`;

const GAP_PROMPT = `You are helping build a knowledge graph of software engineering concepts for senior engineers.

Here is the current graph:
{existing}

The following IDs are referenced in prerequisites/dependents but have no definition yet:
{dangling}

Generate {count} NEW concepts that fill the most critical gaps. Prioritize:
- The dangling IDs listed above — these are broken references that need definitions
- Foundational concepts that many existing ones would depend on
- Practical concepts a senior backend/SRE/fullstack engineer encounters regularly
- Concepts that bridge between existing categories

For each concept, output a YAML document separated by "---". Each must have:
- id: kebab-case unique identifier
- title: human-readable name
- category: array like ["Top Category", "Subcategory"]
- roles: subset of [backend, frontend, sre, fullstack, devops, data]
- lenses: subset of [foundational, practical, career]
- prerequisites: array of concept IDs (use existing IDs when applicable, or IDs of other new concepts you're generating)
- dependents: array of concept IDs that this unlocks (use existing IDs or new ones)
- brief: one sentence explaining what this concept is (aim for "how" or "why", not just "what")

Rules:
- Connect to the existing graph — fill in the gaps, don't create isolated islands
- Target concepts a senior engineer might have gaps in — not beginner stuff
- Keep briefs concise and action-oriented
- Make sure IDs are unique and not already in the existing set

Output ONLY the YAML documents, no markdown fences, no extra text.`;

const REQUIRED_FIELDS = ["id", "title", "category", "roles", "lenses", "prerequisites", "dependents", "brief"] as const;

function validateConcept(concept: Record<string, unknown>): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (concept[field] === undefined) return `missing field: ${field}`;
  }
  for (const field of ["category", "roles", "lenses", "prerequisites", "dependents"] as const) {
    if (!Array.isArray(concept[field])) return `${field} must be an array`;
  }
  if (typeof concept.brief !== "string") return "brief must be a string";
  return null;
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```[\w]*\n?/gm, "").replace(/^```$/gm, "");
}

async function main() {
  const args = process.argv.slice(2);
  const categoryFlag = args.find(a => a.startsWith("--category="));
  const countFlag = args.find(a => a.startsWith("--count="));
  const count = parseInt(countFlag?.split("=")[1] ?? "10");

  const existing = loadAllConcepts("concepts");
  const existingSummary = existing.map(c =>
    `- ${c.id}: "${c.title}" [${c.category.join(" > ")}] prereqs=[${c.prerequisites.join(",")}] dependents=[${c.dependents.join(",")}]`
  ).join("\n");

  let prompt: string;

  if (categoryFlag) {
    const category = categoryFlag.split("=").slice(1).join("=");
    console.log(`Generating ${count} concepts for "${category}"...`);
    prompt = CATEGORY_PROMPT
      .replace("{existing}", existingSummary)
      .replace("{count}", String(count))
      .replace("{category}", category);
  } else {
    const definedIds = new Set(existing.map(c => c.id));
    const referencedIds = new Set(existing.flatMap(c => [...c.prerequisites, ...c.dependents]));
    const dangling = [...referencedIds].filter(id => !definedIds.has(id));

    console.log(`Finding gaps in the concept graph and generating ${count} concepts...`);
    console.log(`Dangling references: ${dangling.length}`);
    prompt = GAP_PROMPT
      .replace("{existing}", existingSummary)
      .replace("{dangling}", dangling.length > 0 ? dangling.join(", ") : "(none)")
      .replace("{count}", String(count));
  }

  console.log(`Existing graph: ${existing.length} concepts\n`);

  const response = await callClaude(prompt);
  const cleaned = stripMarkdownFences(response);

  const docs = cleaned.split(/^---$/m).filter(d => d.trim());
  let saved = 0;

  for (const doc of docs) {
    try {
      const concept = yaml.load(doc.trim()) as Record<string, unknown>;
      if (!concept) continue;

      const error = validateConcept(concept);
      if (error) {
        console.log(`  SKIP (${error}): ${concept.id ?? "unknown"}`);
        continue;
      }

      const id = concept.id as string;
      if (existing.some(c => c.id === id)) {
        console.log(`  SKIP (exists): ${id}`);
        continue;
      }

      const categoryDir = (concept.category as string[])[0]
        .toLowerCase()
        .replace(/\s+/g, "-");
      const dir = path.join("concepts", categoryDir);
      fs.mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, `${id}.yaml`);
      if (fs.existsSync(filePath)) {
        console.log(`  SKIP (file exists): ${filePath}`);
        continue;
      }

      const yamlContent = yaml.dump(concept, { lineWidth: -1, quotingType: '"' });
      fs.writeFileSync(filePath, yamlContent);
      console.log(`  SAVED: ${filePath}`);
      saved++;
    } catch (e) {
      console.log(`  SKIP (parse error): ${(e as Error).message}`);
    }
  }

  console.log(`\nDone. Saved ${saved} new concepts.`);
  console.log("Run 'pnpm generate' to create explanations for them.");
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
