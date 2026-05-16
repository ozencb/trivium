export type Role = "backend" | "frontend" | "sre" | "fullstack" | "devops" | "data";

export type Lens = "foundational" | "practical" | "career";

export type ConceptStatus = "unseen" | "unknown" | "vaguely_known" | "known";

export type ReviewStage = 0 | 1 | 2 | 3 | 4;

export interface ConceptDefinition {
  id: string;
  title: string;
  category: string[];
  roles: Role[];
  lenses: Lens[];
  prerequisites: string[];
  dependents: string[];
  brief: string;
}

export interface ConceptExplanation {
  concept_id: string;
  content: string;
  model: string;
  prompt_version: string;
  generated_at: string;
}

export interface ConceptProgress {
  concept_id: string;
  status: ConceptStatus;
  last_seen: string;
  review_stage: ReviewStage;
  next_review_at: string | null;
}

export interface ConceptWithState extends ConceptDefinition {
  status: ConceptStatus;
  explanation?: string;
}

export interface ScoredConcept extends ConceptWithState {
  score: number;
  isReview: boolean;
}

export interface SessionFilters {
  roles: Role[];
  lenses: Lens[];
}
