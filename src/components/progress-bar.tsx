import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  known: number;
  total: number;
  label?: string;
}

export function ProgressBar({ known, total, label }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
        <p className="text-sm text-muted-foreground tabular-nums">
          {known}/{total} ({percent}%)
        </p>
      </div>
      <Progress value={percent} className="h-1" />
    </div>
  );
}
