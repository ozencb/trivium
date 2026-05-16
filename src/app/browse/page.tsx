import { loadAllConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import { STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-xl font-bold tracking-tight mb-1">Browse Concepts</h1>
      <p className="text-sm text-muted-foreground mb-10">
        All concepts organized by category.
      </p>

      {sortedCategories.map(([category, catConcepts]) => (
        <div key={category} className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            {category}
          </h2>
          <div className="space-y-1.5">
            {catConcepts.map((concept) => {
              const status = progressMap.get(concept.id) ?? "unseen";
              return (
                <Card key={concept.id}>
                  <CardContent className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{concept.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {concept.brief}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {concept.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      <div
                        className={
                          "w-2 h-2 rounded-full " + STATUS_COLORS[status]
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
