// scripts/import-explanations.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getDb, upsertExplanation } from "../src/lib/db";

function walkDir(dir: string, callback: (filePath: string) => void): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath, callback);
    else callback(fullPath);
  }
}

function main() {
  const db = getDb();
  let imported = 0;

  walkDir("concepts", (filePath) => {
    if (!filePath.endsWith(".md")) return;
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, content: body } = matter(content);

    const conceptId = path.basename(filePath, ".md");
    const model = data.model ?? "unknown";
    const promptVersion = data.prompt_version ?? "unknown";

    upsertExplanation(db, {
      concept_id: conceptId,
      content: body.trim(),
      model,
      prompt_version: promptVersion,
    });
    imported++;
  });

  console.log(`Imported ${imported} explanations into DB.`);
  db.close();
}

main();
