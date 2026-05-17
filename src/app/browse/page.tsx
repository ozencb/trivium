import { loadAllConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import { STATUS_COLORS } from "@/lib/constants";
import type { ConceptStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  const concepts = loadAllConcepts();
  const db = getDb();
  const progress = getAllProgress(db);
  db.close();

  const progressMap = new Map(
    progress.map((p) => [p.concept_id, p.status as ConceptStatus]),
  );

  const categories = new Map<string, typeof concepts>();
  for (const concept of concepts) {
    const key = concept.category[0] ?? "Uncategorized";
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key)!.push(concept);
  }

  const sortedCategories = [...categories.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-lg font-semibold tracking-tight mb-1">Browse</h1>
      <p className="text-sm text-muted-foreground mb-8">
        All concepts organized by category.
      </p>

      {sortedCategories.map(([category, catConcepts]) => (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-3 mb-1 px-1">
            <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              {category}
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div>
            {catConcepts.map((concept) => {
              const status = progressMap.get(concept.id) ?? "unseen";
              return (
                <div
                  key={concept.id}
                  className="flex items-start gap-3 px-2.5 py-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_COLORS[status]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{concept.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {concept.brief}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {concept.roles.map((role) => (
                      <span
                        key={role}
                        className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
