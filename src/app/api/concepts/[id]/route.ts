import { NextRequest, NextResponse } from "next/server";
import { loadAllConcepts, getConceptById } from "@/lib/concepts";
import { getDb, getProgress, getExplanation } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const concepts = loadAllConcepts();
  const concept = getConceptById(concepts, id);

  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  const db = getDb();
  try {
    const progress = getProgress(db, id);
    const explanation = getExplanation(db, id);

    return NextResponse.json({
      ...concept,
      status: progress?.status ?? "unseen",
      explanation: explanation?.content ?? null,
    });
  } finally {
    db.close();
  }
}
