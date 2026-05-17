import type { Role, Lens, ConceptStatus } from "./types";

export const ALL_ROLES: Role[] = ["backend", "frontend", "sre", "fullstack", "devops", "data"];
export const ALL_LENSES: Lens[] = ["foundational", "practical", "career"];

export const STATUS_COLORS: Record<ConceptStatus, string> = {
  known: "bg-emerald-400",
  vaguely_known: "bg-amber-400",
  unknown: "bg-sky-400",
  unseen: "bg-muted-foreground/30",
};

export const STATUS_TEXT_COLORS: Record<ConceptStatus, string> = {
  known: "text-emerald-400",
  vaguely_known: "text-amber-400",
  unknown: "text-sky-400",
  unseen: "text-muted-foreground",
};

export const STATUS_BUTTON_COLORS: Record<string, string> = {
  known: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-400/20",
  vaguely_known: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 dark:text-amber-400 dark:border-amber-400/20",
  unknown: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 dark:text-blue-400 dark:border-blue-400/20",
};

export const REVIEW_INTERVALS_DAYS: Record<number, number> = {
  1: 7,
  2: 30,
  3: 90,
};
