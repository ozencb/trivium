import Link from "next/link";
import { loadAllConcepts } from "@/lib/concepts";
import { getDb, getAllProgress } from "@/lib/db";
import { STATUS_TEXT_COLORS } from "@/lib/constants";
import { ProgressBar } from "@/components/progress-bar";
import { buttonVariants } from "@/components/ui/button";
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
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-10">
        <h1 className="text-lg font-semibold tracking-tight mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Master the prerequisites. Unlock what&apos;s next.
        </p>
      </div>

      <ProgressBar
        known={known}
        total={concepts.length}
        label="Overall Progress"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="rounded-lg bg-card ring-1 ring-foreground/[0.06] px-3.5 py-3"
          >
            <p className="text-xs text-muted-foreground mb-1">{status.label}</p>
            <p className={cn("text-xl font-bold tabular-nums", status.color)}>
              {status.count}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2.5">
        <Link href="/session" className={cn(buttonVariants())}>
          Start Session
        </Link>
        <Link
          href="/browse"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Browse
        </Link>
      </div>
    </div>
  );
}
