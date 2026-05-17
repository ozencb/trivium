import { NextRequest, NextResponse } from "next/server";
import { loadAllConcepts, filterConcepts } from "@/lib/concepts";
import { getDb, getAllProgress, getExplanation } from "@/lib/db";
import { scoreConcepts } from "@/lib/scoring";
import type { ConceptStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roles = searchParams.get("roles")?.split(",").filter(Boolean) ?? [];
  const lenses = searchParams.get("lenses")?.split(",").filter(Boolean) ?? [];

  let concepts = loadAllConcepts();
  if (roles.length || lenses.length) {
    concepts = filterConcepts(concepts, { roles, lenses });
  }

  const db = getDb();
  try {
    const progress = getAllProgress(db);
    const progressMap: Record<string, ConceptStatus> = {};
    const reviewMap: Record<string, string | null> = {};
    for (const p of progress) {
      progressMap[p.concept_id] = p.status;
      if (p.next_review_at) {
        reviewMap[p.concept_id] = p.next_review_at;
      }
    }

    const scored = scoreConcepts(concepts, progressMap, reviewMap);

    if (scored.length === 0) {
      return NextResponse.json({ done: true, message: "All concepts reviewed" });
    }

    const next = scored[0];
    const explanation = getExplanation(db, next.id);

    return NextResponse.json({
      ...next,
      explanation: explanation?.content || null,
    });
  } finally {
    db.close();
  }
}
