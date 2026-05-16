import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { getDb, updateProgress, getProgress, upsertExplanation, getExplanation } from "../db";

const TEST_DB = "data/test.db";

beforeEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

afterEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe("getDb", () => {
  it("creates tables on first connection", () => {
    const db = getDb(TEST_DB);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain("explanations");
    expect(names).toContain("progress");
    db.close();
  });
});

describe("progress", () => {
  it("returns null for unknown concept", () => {
    const db = getDb(TEST_DB);
    const result = getProgress(db, "nonexistent");
    expect(result).toBeNull();
    db.close();
  });

  it("updates and retrieves progress", () => {
    const db = getDb(TEST_DB);
    updateProgress(db, "tcp-basics", "known");
    const result = getProgress(db, "tcp-basics");
    expect(result!.status).toBe("known");
    expect(result!.concept_id).toBe("tcp-basics");
    db.close();
  });
});

describe("explanations", () => {
  it("upserts and retrieves explanation", () => {
    const db = getDb(TEST_DB);
    upsertExplanation(db, {
      concept_id: "tcp-basics",
      content: "TCP is...",
      model: "claude-sonnet-4-6",
      prompt_version: "v1-abc123",
    });
    const result = getExplanation(db, "tcp-basics");
    expect(result!.content).toBe("TCP is...");
    expect(result!.prompt_version).toBe("v1-abc123");
    db.close();
  });

  it("overwrites on second upsert", () => {
    const db = getDb(TEST_DB);
    upsertExplanation(db, {
      concept_id: "tcp-basics",
      content: "old",
      model: "claude-sonnet-4-6",
      prompt_version: "v1",
    });
    upsertExplanation(db, {
      concept_id: "tcp-basics",
      content: "new",
      model: "claude-sonnet-4-6",
      prompt_version: "v2",
    });
    const result = getExplanation(db, "tcp-basics");
    expect(result!.content).toBe("new");
    db.close();
  });
});
