import { loadAllConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import { ProgressBar } from "@/components/progress-bar";
import type { ConceptStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const concepts = loadAllConcepts();
  const db = getDb();
  const progress = getAllProgress(db);
  db.close();

  const progressMap = new Map(
    progress.map((p) => [p.concept_id, p.status as ConceptStatus]),
  );

  const byCategory = new Map<string, { total: number; known: number }>();
  const byRole = new Map<string, { total: number; known: number }>();
  const byLens = new Map<string, { total: number; known: number }>();

  for (const concept of concepts) {
    const status = progressMap.get(concept.id) ?? "unseen";
    const isKnown = status === "known";

    const cat = concept.category[0] ?? "Uncategorized";
    const catStats = byCategory.get(cat) ?? { total: 0, known: 0 };
    catStats.total++;
    if (isKnown) catStats.known++;
    byCategory.set(cat, catStats);

    for (const role of concept.roles) {
      const roleStats = byRole.get(role) ?? { total: 0, known: 0 };
      roleStats.total++;
      if (isKnown) roleStats.known++;
      byRole.set(role, roleStats);
    }

    for (const lens of concept.lenses) {
      const lensStats = byLens.get(lens) ?? { total: 0, known: 0 };
      lensStats.total++;
      if (isKnown) lensStats.known++;
      byLens.set(lens, lensStats);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-lg font-semibold tracking-tight mb-8">Progress</h1>

      <section className="mb-10">
        <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
          By Category
        </h2>
        <div className="space-y-3">
          {[...byCategory.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([cat, stats]) => (
              <ProgressBar
                key={cat}
                label={cat}
                known={stats.known}
                total={stats.total}
              />
            ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
          By Role
        </h2>
        <div className="space-y-3">
          {[...byRole.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([role, stats]) => (
              <ProgressBar
                key={role}
                label={role}
                known={stats.known}
                total={stats.total}
              />
            ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
          By Lens
        </h2>
        <div className="space-y-3">
          {[...byLens.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([lens, stats]) => (
              <ProgressBar
                key={lens}
                label={lens}
                known={stats.known}
                total={stats.total}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
