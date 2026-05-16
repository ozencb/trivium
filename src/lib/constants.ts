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
  known: "bg-emerald-600 hover:bg-emerald-700",
  vaguely_known: "bg-amber-600 hover:bg-amber-700",
  unknown: "bg-sky-600 hover:bg-sky-700",
};

export const REVIEW_INTERVALS_DAYS: Record<number, number> = {
  1: 7,
  2: 30,
  3: 90,
};
