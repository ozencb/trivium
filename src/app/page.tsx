import Link from "next/link";
import { loadAllConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import { STATUS_TEXT_COLORS } from "@/lib/constants";
import { ProgressBar } from "@/components/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function Home() {
  const concepts = loadAllConcepts();
  const db = getDb();
  const progress = getAllProgress(db);
  db.close();

  const known = progress.filter((p) => p.status === "known").length;
  const vaguely = progress.filter((p) => p.status === "vaguely_known").length;
  const unknown = progress.filter((p) => p.status === "unknown").length;
  const unseen = concepts.length - known - vaguely - unknown;

  const statuses = [
    { label: "Known", count: known, color: STATUS_TEXT_COLORS.known },
    {
      label: "Vaguely Known",
      count: vaguely,
      color: STATUS_TEXT_COLORS.vaguely_known,
    },
    { label: "Unknown", count: unknown, color: STATUS_TEXT_COLORS.unknown },
    { label: "Unseen", count: unseen, color: STATUS_TEXT_COLORS.unseen },
  ];

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-xl font-bold tracking-tight mb-1">
        Trivium
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Master the prerequisites. Unlock what&apos;s next.
      </p>

      <ProgressBar
        known={known}
        total={concepts.length}
        label="Overall Progress"
      />

      <div className="grid grid-cols-4 gap-3 mt-10">
        {statuses.map((status) => (
          <Card key={status.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground mb-1">
                {status.label}
              </p>
              <p className={cn("text-2xl font-bold", status.color)}>
                {status.count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex gap-3">
        <Link href="/session" className={cn(buttonVariants({ size: "lg" }))}>
          Start Session
        </Link>
        <Link
          href="/browse"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Browse
        </Link>
      </div>
    </div>
  );
}
