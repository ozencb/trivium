"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_BUTTON_COLORS } from "@/lib/constants";
import type { ConceptStatus, ScoredConcept } from "@/lib/types";

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-5 mb-2">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-4 mb-2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2.5">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-2.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="mb-0.5">{children}</li>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-2.5 text-xs">{children}</pre>,
};

interface ConceptCardProps {
  concept: ScoredConcept & { explanation?: string | null };
  isReview?: boolean;
  onSaveProgress: (status: ConceptStatus) => void;
  onAdvance: () => void;
}

export function ConceptCard({ concept, isReview, onSaveProgress, onAdvance }: ConceptCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  function handleStatus(status: ConceptStatus) {
    if (status === "known") {
      onSaveProgress(status);
      onAdvance();
    } else {
      onSaveProgress(status);
      setShowExplanation(true);
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          {concept.category.join(" / ")}
        </p>
        {isReview && (
          <span className="inline-block text-[10px] font-medium uppercase tracking-widest text-amber-400 border border-amber-400/30 rounded px-1.5 py-0.5 mb-2">
            Review
          </span>
        )}
        <h2 className="text-lg font-bold mb-1">{concept.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{concept.brief}</p>

        {!showExplanation && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className={`${STATUS_BUTTON_COLORS.known} text-sm`}
              onClick={() => handleStatus("known")}
            >
              I know this
            </Button>
            <Button
              size="sm"
              variant="default"
              className={`${STATUS_BUTTON_COLORS.vaguely_known} text-sm`}
              onClick={() => handleStatus("vaguely_known")}
            >
              Vaguely
            </Button>
            <Button
              size="sm"
              variant="default"
              className={`${STATUS_BUTTON_COLORS.unknown} text-sm`}
              onClick={() => handleStatus("unknown")}
            >
              Don&apos;t know
            </Button>
          </div>
        )}

        {showExplanation && concept.explanation && (
          <div className="mt-6 text-left max-w-none text-sm leading-relaxed">
            <Markdown components={markdownComponents}>{concept.explanation}</Markdown>
            <div className="mt-6 flex gap-2">
              <Button size="sm" variant="outline" className="text-sm" onClick={() => { onSaveProgress("known"); onAdvance(); }}>
                Got it — mark known
              </Button>
              <Button size="sm" variant="outline" className="text-sm" onClick={() => onAdvance()}>
                Still fuzzy — next
              </Button>
            </div>
          </div>
        )}

        {showExplanation && !concept.explanation && (
          <div className="mt-6">
            <p className="text-muted-foreground text-sm mb-4">
              No explanation generated yet. Run <code>pnpm generate</code> to populate.
            </p>
            <Button size="sm" variant="outline" className="text-sm" onClick={() => onAdvance()}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
