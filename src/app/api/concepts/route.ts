import { NextRequest, NextResponse } from "next/server";
import { loadAllConcepts, filterConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import type { ConceptWithState, ConceptStatus } from "@/lib/types";

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
    const progressMap = new Map(progress.map(p => [p.concept_id, p.status]));

    const result: ConceptWithState[] = concepts.map(c => ({
      ...c,
      status: progressMap.get(c.id) ?? ("unseen" as ConceptStatus),
    }));

    return NextResponse.json(result);
  } finally {
    db.close();
  }
}
