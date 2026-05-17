// scripts/generate.ts
import fs from "fs";
import path from "path";
import { loadAllConcepts } from "../src/lib/concepts";
import { getDb, upsertExplanation } from "../src/lib/db";
import { buildPrompt, getPromptVersion } from "./prompt-template";
import { callClaude, runConcurrent, MODEL } from "./claude";
import type { ConceptDefinition } from "../src/lib/types";

const CONCURRENCY = parseInt(process.env.GENERATE_CONCURRENCY ?? "5");

function getExplanationPath(concept: ConceptDefinition): string {
  const categoryDir = concept.category[0].toLowerCase().replace(/\s+/g, "-");
  return path.join("concepts", categoryDir, `${concept.id}.md`);
}

function needsGeneration(concept: ConceptDefinition, promptVersion: string): boolean {
  const mdPath = getExplanationPath(concept);
  if (!fs.existsSync(mdPath)) return true;
  const content = fs.readFileSync(mdPath, "utf-8");
  const match = content.match(/^prompt_version:\s*(.+)$/m);
  return !match || match[1].trim() !== promptVersion;
}

async function main() {
  const args = process.argv.slice(2);
  const categoryFlag = args.find(a => a.startsWith("--category="));
  const categoryFilter = categoryFlag ? categoryFlag.split("=")[1] : undefined;
  const regenerate = args.includes("--regenerate");

  const promptVersion = getPromptVersion();

  console.log("Prompt version: " + promptVersion);
  console.log("Model: " + MODEL);
  console.log("Concurrency: " + CONCURRENCY);

  let concepts = loadAllConcepts("concepts");
  if (categoryFilter) {
    concepts = concepts.filter(c =>
      c.category.some(cat => cat.toLowerCase().includes(categoryFilter.toLowerCase()))
    );
    console.log("Filtered to category: " + concepts.length + " concepts");
  }

  const toGenerate = regenerate
    ? concepts
    : concepts.filter(c => needsGeneration(c, promptVersion));

  console.log("\nTotal concepts: " + concepts.length);
  console.log("Need generation: " + toGenerate.length);
  console.log("Already up-to-date: " + (concepts.length - toGenerate.length) + "\n");

  if (toGenerate.length === 0) {
    console.log("Nothing to generate. Done.");
    return;
  }

  const db = getDb();
  let completed = 0;

  await runConcurrent(toGenerate, async (concept) => {
    const prompt = buildPrompt(concept, concepts);
    const text = await callClaude(prompt);

    upsertExplanation(db, {
      concept_id: concept.id,
      content: text,
      model: MODEL,
      prompt_version: promptVersion,
    });

    const mdPath = getExplanationPath(concept);
    const mdContent = [
      "---",
      `model: ${MODEL}`,
      `prompt_version: ${promptVersion}`,
      "---",
      "",
      text,
      "",
    ].join("\n");
    fs.writeFileSync(mdPath, mdContent);

    completed++;
    console.log("[" + completed + "/" + toGenerate.length + "] Generated: " + concept.title);
  }, CONCURRENCY);

  console.log("\nDone. Generated " + completed + " explanations.");
  db.close();
}

main().catch(err => {
  console.error("Generation failed:", err);
  process.exit(1);
});
