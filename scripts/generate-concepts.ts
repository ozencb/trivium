// scripts/generate-concepts.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { loadAllConcepts } from "../src/lib/concepts";

const MODEL = process.env.GENERATE_MODEL ?? "claude-sonnet-4-6";

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", "--model", MODEL], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`claude exited ${code}: ${stderr}`));
      else resolve(stdout.trim());
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

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

Analyze this graph and identify the biggest gaps — important concepts that are missing. Consider:
1. Broken references: concepts listed in "dependents" or "prerequisites" that don't exist as their own node yet
2. Missing foundations: important concepts that would logically precede or connect existing ones
3. Entire missing categories that a senior engineer should know (e.g., if there's no concurrency, no API design, no observability, etc.)
4. Concepts that would create bridges between existing categories

Generate {count} NEW concepts that fill the most critical gaps. Prioritize:
- Concepts referenced but not defined (dangling IDs in prerequisites/dependents)
- Foundational concepts that many others would depend on
- Practical concepts a senior backend/SRE/fullstack engineer encounters regularly

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
    console.log(`Finding gaps in the concept graph and generating ${count} concepts...`);
    prompt = GAP_PROMPT
      .replace("{existing}", existingSummary)
      .replace("{count}", String(count));
  }

  console.log(`Existing graph: ${existing.length} concepts\n`);

  const response = await callClaude(prompt);

  const docs = response.split(/^---$/m).filter(d => d.trim());
  let saved = 0;

  for (const doc of docs) {
    try {
      const concept = yaml.load(doc.trim()) as Record<string, unknown>;
      if (!concept || !concept.id || !concept.title) continue;

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
