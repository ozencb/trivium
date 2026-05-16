import path from "path";
import Database from "better-sqlite3";
import type { ConceptStatus, ReviewStage } from "./types";
import { REVIEW_INTERVALS_DAYS } from "./constants";

export function getDb(dbPath = path.join(process.cwd(), "data/learn.db")): Database.Database {
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
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      review_stage INTEGER NOT NULL DEFAULT 0,
      next_review_at TEXT
    );
  `);
  addColumnIfMissing(db, "progress", "review_stage", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(db, "progress", "next_review_at", "TEXT");
  return db;
}

function addColumnIfMissing(db: Database.Database, table: string, column: string, type: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export function updateProgress(db: Database.Database, conceptId: string, status: ConceptStatus): void {
  db.prepare(`
    INSERT INTO progress (concept_id, status, last_seen)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(concept_id) DO UPDATE SET status = ?, last_seen = datetime('now')
  `).run(conceptId, status, status);
}

export function updateProgressWithReview(db: Database.Database, conceptId: string, status: ConceptStatus): void {
  const existing = getProgress(db, conceptId);

  if (status === "known") {
    const currentStage = (existing?.review_stage ?? 0) as ReviewStage;
    const nextStage = Math.min(currentStage + 1, 4) as ReviewStage;
    const intervalDays = REVIEW_INTERVALS_DAYS[nextStage] ?? null;
    const nextReviewAt = intervalDays
      ? new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null;

    db.prepare(`
      INSERT INTO progress (concept_id, status, last_seen, review_stage, next_review_at)
      VALUES (?, 'known', datetime('now'), ?, ?)
      ON CONFLICT(concept_id) DO UPDATE SET
        status = 'known', last_seen = datetime('now'), review_stage = ?, next_review_at = ?
    `).run(conceptId, nextStage, nextReviewAt, nextStage, nextReviewAt);
  } else {
    db.prepare(`
      INSERT INTO progress (concept_id, status, last_seen, review_stage, next_review_at)
      VALUES (?, ?, datetime('now'), 0, NULL)
      ON CONFLICT(concept_id) DO UPDATE SET
        status = ?, last_seen = datetime('now'), review_stage = 0, next_review_at = NULL
    `).run(conceptId, status, status);
  }
}

export function getProgress(db: Database.Database, conceptId: string) {
  return db.prepare("SELECT * FROM progress WHERE concept_id = ?").get(conceptId) as
    { concept_id: string; status: ConceptStatus; last_seen: string; review_stage: number; next_review_at: string | null } | null ?? null;
}

export function upsertExplanation(db: Database.Database, params: {
  concept_id: string;
  content: string;
  model: string;
  prompt_version: string;
}): void {
  db.prepare(`
    INSERT INTO explanations (concept_id, content, model, prompt_version, generated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(concept_id) DO UPDATE SET content = ?, model = ?, prompt_version = ?, generated_at = datetime('now')
  `).run(params.concept_id, params.content, params.model, params.prompt_version,
    params.content, params.model, params.prompt_version);
}

export function getExplanation(db: Database.Database, conceptId: string) {
  return db.prepare("SELECT * FROM explanations WHERE concept_id = ?").get(conceptId) as
    { concept_id: string; content: string; model: string; prompt_version: string; generated_at: string } | null ?? null;
}

export function getAllProgress(db: Database.Database) {
  return db.prepare("SELECT * FROM progress").all() as
    { concept_id: string; status: ConceptStatus; last_seen: string; review_stage: number; next_review_at: string | null }[];
}

export function getAllExplanations(db: Database.Database) {
  return db.prepare("SELECT concept_id, prompt_version FROM explanations").all() as
    { concept_id: string; prompt_version: string }[];
}
