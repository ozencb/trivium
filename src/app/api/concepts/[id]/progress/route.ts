import { NextRequest, NextResponse } from "next/server";
import { getDb, updateProgressWithReview } from "@/lib/db";
import type { ConceptStatus } from "@/lib/types";

const VALID_STATUSES: ConceptStatus[] = ["unseen", "unknown", "vaguely_known", "known"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body as { status: string };

  if (!VALID_STATUSES.includes(status as ConceptStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();
  try {
    updateProgressWithReview(db, id, status as ConceptStatus);
    return NextResponse.json({ success: true, concept_id: id, status });
  } finally {
    db.close();
  }
}
