const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function walkDir(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath, callback);
    else callback(fullPath);
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const data = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) data[key.trim()] = rest.join(":").trim();
  }
  return { data, body: match[2] };
}

function importExplanations() {
  const dbPath = path.join(process.cwd(), "data/learn.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS explanations (
      concept_id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS progress (
      concept_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'unseen',
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const stmt = db.prepare(`
    INSERT INTO explanations (concept_id, content, model, prompt_version, generated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(concept_id) DO UPDATE SET content = ?, model = ?, prompt_version = ?, generated_at = datetime('now')
  `);

  let imported = 0;
  const conceptsDir = path.join(process.cwd(), "concepts");
  if (fs.existsSync(conceptsDir)) {
    walkDir(conceptsDir, (filePath) => {
      if (!filePath.endsWith(".md")) return;
      const { data, body } = parseFrontmatter(fs.readFileSync(filePath, "utf-8"));
      const conceptId = path.basename(filePath, ".md");
      const model = data.model || "unknown";
      const promptVersion = data.prompt_version || "unknown";
      const content = body.trim();
      if (content) {
        stmt.run(conceptId, content, model, promptVersion, content, model, promptVersion);
        imported++;
      }
    });
  }

  console.log(`Imported ${imported} explanations.`);
  db.close();
}

importExplanations();
require("./server.js");
