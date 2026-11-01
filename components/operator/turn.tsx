"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drillDownQuestion } from "@/lib/copy";
import type { Dataset } from "@/lib/data/seed";
import { axisDef, optionLabel, type Axis } from "@/lib/grammar";
import { alternativesFor, clarifyFor, deriveView, followUpsOf, nextStepOf, type Turn as TurnState } from "@/lib/turn";
import { cn } from "@/lib/utils";
import { JevMark } from "./jev-mark";
import { ThoughtProcess } from "./thought-process";
import { ViewCard, type NextStep } from "./view-card";

type Props = {
  turn: TurnState;
  dataset: Dataset;
  isLatest: boolean;
  onOverride: (axis: Axis, value: string) => void;
  onAsk: (question: string) => void;
  onRetry: () => void;
  onSave: () => void;
};

export function Turn({ turn, dataset, isLatest, onOverride, onAsk, onRetry, onSave }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p data-slot="bubble" className="max-w-[85%] self-end rounded-xl rounded-br-sm bg-secondary px-3 py-1.5 text-sm text-foreground">{turn.text}</p>
      {turn.status === "pending" && (
        <p className="flex items-center gap-2 pl-0.5 text-sm text-muted-foreground">
          <JevMark className="size-3.5 animate-pulse" />
          <span className="animate-pulse">Asking Jev what to build</span>
        </p>
      )}
      {turn.status === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
          <span className="text-destructive">{turn.error}</span>
          <Button size="xs" variant="outline" onClick={onRetry}>
            <RotateCcw /> Retry
          </Button>
        </div>
      )}
      {turn.status === "done" && turn.decision && (
        <Answer turn={turn} decision={turn.decision} dataset={dataset} isLatest={isLatest} onOverride={onOverride} onAsk={onAsk} onSave={onSave} />
      )}
    </div>
  );
}

function Answer({
  turn,
  decision,
  dataset,
  isLatest,
  onOverride,
  onAsk,
  onSave,
}: Omit<Props, "onRetry"> & { decision: NonNullable<TurnState["decision"]> }) {
  const { overrides } = turn;
  const view = deriveView(decision, overrides, dataset);
  const clarify = clarifyFor(decision, overrides);
  const alternatives = alternativesFor(decision, overrides, view.coerced);
  const nextStep = nextStepOf(decision, overrides) as NextStep;
  const effective = { ...view.spec, nextStep };

  const handleAction = (step: NextStep) => {
    if (step === "save") onSave();
    if (step === "drillDown") onAsk(drillDownQuestion(view.spec, view.data));
  };

  return (
    <div className="flex flex-col gap-3">
      <ThoughtProcess decision={decision} overrides={overrides} coerced={view.coerced} effective={effective} onOverride={onOverride} onAsk={onAsk} />

      {clarify ? (
        <div className="animate-card-enter flex flex-col gap-2.5">
          <p className="text-sm text-secondary-foreground">
            I&apos;m not sure what you&apos;d like to see for “{turn.text}”. Pick a {axisDef(clarify.axis).label.toLowerCase()}:
          </p>
          <div className="flex flex-wrap gap-2">
            {clarify.options.map((o) => (
              <Chip key={o.key} onClick={() => onOverride(clarify.axis, o.key)}>
                {optionLabel(clarify.axis, o.key)}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-secondary-foreground">{view.summary}</p>
          {alternatives.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {alternatives.map((alt) => (
                <span key={alt.axis} className="flex items-center gap-1.5">
                  {axisDef(alt.axis).label}: {optionLabel(alt.axis, alt.current)}
                  <button
                    type="button"
                    data-slot="alt-chip"
                    onClick={() => onOverride(alt.axis, alt.runnerUp)}
                    className="rounded-pill border border-dashed border-signal/40 px-2 py-0.5 text-signal transition-colors hover:border-solid hover:bg-signal-soft"
                  >
                    or {optionLabel(alt.axis, alt.runnerUp)}?
                  </button>
                </span>
              ))}
            </div>
          )}
          <ViewCard
            key={`${view.spec.chart}-${view.spec.metric}-${view.spec.splitBy}-${view.spec.range}-${view.spec.focus}-${view.spec.compare}`}
            spec={view.spec}
            data={view.data}
            title={view.title}
            summary={view.summary}
            nextStep={nextStep}
            onAction={handleAction}
          />
          {isLatest && (
            <div className="flex flex-wrap gap-2">
              {followUpsOf(decision).map((q) => (
                <Chip key={q} onClick={() => onAsk(q)}>
                  {q}
                </Chip>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function Chip({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      data-slot="chip"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 rounded-pill bg-secondary px-3 py-1 text-left text-xs text-secondary-foreground transition-colors duration-150 hover:bg-hover hover:text-foreground",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60" />
    </button>
  );
}
