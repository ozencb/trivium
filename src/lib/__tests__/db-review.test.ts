import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { getDb, updateProgressWithReview, getProgress, getAllProgress } from "../db";

const TEST_DB = "data/test-review.db";

beforeEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

afterEach(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe("review scheduling", () => {
  it("sets review_stage=1 and next_review_at when marking known", () => {
    const db = getDb(TEST_DB);
    updateProgressWithReview(db, "cap-theorem", "known");
    const result = getProgress(db, "cap-theorem");
    expect(result!.review_stage).toBe(1);
    expect(result!.next_review_at).not.toBeNull();
    const reviewDate = new Date(result!.next_review_at!);
    const now = new Date();
    const diffDays = Math.round((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
    db.close();
  });

  it("advances review stage when confirming known during review", () => {
    const db = getDb(TEST_DB);
    updateProgressWithReview(db, "cap-theorem", "known");
    updateProgressWithReview(db, "cap-theorem", "known");
    const result = getProgress(db, "cap-theorem");
    expect(result!.review_stage).toBe(2);
    const reviewDate = new Date(result!.next_review_at!);
    const now = new Date();
    const diffDays = Math.round((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(30);
    db.close();
  });

  it("graduates after stage 3 confirmation", () => {
    const db = getDb(TEST_DB);
    updateProgressWithReview(db, "cap-theorem", "known");
    updateProgressWithReview(db, "cap-theorem", "known");
    updateProgressWithReview(db, "cap-theorem", "known");
    updateProgressWithReview(db, "cap-theorem", "known");
    const result = getProgress(db, "cap-theorem");
    expect(result!.review_stage).toBe(4);
    expect(result!.next_review_at).toBeNull();
    db.close();
  });

  it("resets review when downgrading from known", () => {
    const db = getDb(TEST_DB);
    updateProgressWithReview(db, "cap-theorem", "known");
    updateProgressWithReview(db, "cap-theorem", "vaguely_known");
    const result = getProgress(db, "cap-theorem");
    expect(result!.status).toBe("vaguely_known");
    expect(result!.review_stage).toBe(0);
    expect(result!.next_review_at).toBeNull();
    db.close();
  });

  it("getAllProgress includes review fields", () => {
    const db = getDb(TEST_DB);
    updateProgressWithReview(db, "cap-theorem", "known");
    const all = getAllProgress(db);
    const entry = all.find(p => p.concept_id === "cap-theorem");
    expect(entry!.review_stage).toBe(1);
    expect(entry!.next_review_at).not.toBeNull();
    db.close();
  });
});
