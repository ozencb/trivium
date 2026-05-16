// scripts/generate.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { loadAllConcepts } from "../src/lib/concepts";
import { getDb, upsertExplanation, getAllExplanations } from "../src/lib/db";
import { buildPrompt, getPromptVersion } from "./prompt-template";
import type { ConceptDefinition } from "../src/lib/types";

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

function getExplanationPath(concept: ConceptDefinition): string {
  const categoryDir = concept.category[0].toLowerCase().replace(/\s+/g, "-");
  return path.join("concepts", categoryDir, `${concept.id}.md`);
}

async function main() {
  const args = process.argv.slice(2);
  const categoryFlag = args.find(a => a.startsWith("--category="));
  const categoryFilter = categoryFlag ? categoryFlag.split("=")[1] : undefined;
  const regenerate = args.includes("--regenerate");

  const promptVersion = getPromptVersion();

  console.log("Prompt version: " + promptVersion);
  console.log("Model: " + MODEL);

  let concepts = loadAllConcepts("concepts");
  if (categoryFilter) {
    concepts = concepts.filter(c =>
      c.category.some(cat => cat.toLowerCase().includes(categoryFilter.toLowerCase()))
    );
    console.log("Filtered to category: " + concepts.length + " concepts");
  }

  const db = getDb();
  const existing = getAllExplanations(db);
  const existingMap = new Map(existing.map(e => [e.concept_id, e.prompt_version]));

  const toGenerate = concepts.filter(concept => {
    if (regenerate) return true;
    const mdPath = getExplanationPath(concept);
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, "utf-8");
      const match = content.match(/^prompt_version:\s*(.+)$/m);
      if (match && match[1].trim() === promptVersion) return false;
    }
    const stored = existingMap.get(concept.id);
    return !stored || stored !== promptVersion;
  });

  console.log("\nTotal concepts: " + concepts.length);
  console.log("Need generation: " + toGenerate.length);
  console.log("Already up-to-date: " + (concepts.length - toGenerate.length) + "\n");

  if (toGenerate.length === 0) {
    console.log("Nothing to generate. Done.");
    db.close();
    return;
  }

  let completed = 0;
  for (const concept of toGenerate) {
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
  }

  console.log("\nDone. Generated " + completed + " explanations.");
  db.close();
}

main().catch(err => {
  console.error("Generation failed:", err);
  process.exit(1);
});
