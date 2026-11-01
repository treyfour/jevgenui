"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { questionCount, type Decision, type Overrides } from "@/lib/decision";
import { axisDef, axisOrder, clarityQuestion, optionLabel, type Axis } from "@/lib/grammar";
import { ranked, tierOf } from "@/lib/policy";
import type { Coercions } from "@/lib/resolve";
import { cn } from "@/lib/utils";
import { ConfidenceMeter } from "./confidence-meter";
import { JevMark } from "./jev-mark";

const DISTRIBUTION_LIMIT = 6;

type Props = {
  decision: Decision;
  overrides: Overrides;
  coerced: Coercions;
  /** The value each axis ends up with after overrides and code repairs. */
  effective: Partial<Record<Axis, string>>;
  onOverride: (axis: Axis, value: string) => void;
  onAsk: (question: string) => void;
};

export function ThoughtProcess({ decision, overrides, coerced, effective, onOverride, onAsk }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Axis | null>(null);
  const clarityConfidence = Math.abs(decision.clarity - 0.5) * 2;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group -ml-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
        <JevMark className="size-3.5" />
        <span className="font-medium">Thought process</span>
        <span className="font-mono text-xs text-faint">
          {questionCount} questions, {decision.latencyMs} ms
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-2 ml-1 border-l pl-4">
          <div className="flex flex-col">
            <Row label={clarityQuestion.label} value={decision.clarity >= 0.5 ? "Yes" : "No"} p={Math.max(decision.clarity, 1 - decision.clarity)} tier={tierOf(clarityConfidence)} />
            {axisOrder.map((axis) => {
              const answer = decision.answers[axis];
              const value = effective[axis] ?? answer.choice;
              const isOpen = expanded === axis;
              const options = ranked(answer);
              return (
                <div key={axis}>
                  <Row
                    label={axisDef(axis).label}
                    value={optionLabel(axis, value)}
                    p={answer.probabilities[value] ?? 0}
                    tier={tierOf(answer.confidence)}
                    you={overrides[axis] !== undefined}
                    code={coerced[axis as keyof Coercions]}
                    open={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : axis)}
                  />
                  {isOpen && (
                    <ul className="mb-1 flex flex-col">
                      {options.slice(0, DISTRIBUTION_LIMIT).map((o) => (
                        <li key={o.key}>
                          <button
                            type="button"
                            onClick={() => (axis === "followUp" ? onAsk(optionLabel(axis, o.key)) : onOverride(axis, o.key))}
                            className={cn(
                              "grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md py-1 pr-1 pl-[5.5rem] text-left text-sm hover:bg-muted",
                              o.key === value ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="truncate">{optionLabel(axis, o.key)}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-1 w-12 overflow-hidden rounded-bar bg-border">
                                <span className="block h-full rounded-bar bg-signal" style={{ width: `${o.p * 100}%` }} />
                              </span>
                              <span className="w-9 text-right text-xs tabular-nums">{pct(o.p)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                      {options.length > DISTRIBUTION_LIMIT && (
                        <li className="py-1 pl-[5.5rem] text-xs text-muted-foreground">
                          {options.length - DISTRIBUTION_LIMIT} more, together {pct(options.slice(DISTRIBUTION_LIMIT).reduce((a, o) => a + o.p, 0))}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-2xs text-faint">
            {questionCount} answers · {decision.latencyMs} ms · ${decision.costUsd.toPrecision(2)} · {decision.model}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function pct(p: number) {
  return `${Math.round(p * 100)}%`;
}

type RowProps = {
  label: string;
  value: string;
  p: number;
  tier: ReturnType<typeof tierOf>;
  you?: boolean;
  code?: string;
  open?: boolean;
  onToggle?: () => void;
};

function Row({ label, value, p, tier, you, code, open, onToggle }: RowProps) {
  const content = (
    <>
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate font-medium">{value}</span>
        {you && <span data-slot="tag" className="rounded-pill bg-you px-1.5 text-2xs font-medium text-you-foreground">You</span>}
        {code && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span data-slot="tag" className="rounded-sm bg-secondary px-1.5 text-2xs text-muted-foreground">
                Code
              </span>
            </TooltipTrigger>
            <TooltipContent>{code}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="flex items-center gap-2">
        <ConfidenceMeter tier={tier} muted={you || !!code} />
        <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{pct(p)}</span>
        {onToggle ? (
          <ChevronRight className={cn("size-3.5 text-muted-foreground/60 transition-transform", open && "rotate-90")} />
        ) : (
          <span className="size-3.5" />
        )}
      </span>
    </>
  );
  const className = "flex w-full items-center gap-3 rounded-md py-1.5 pr-1 text-left text-sm";
  return onToggle ? (
    <button type="button" onClick={onToggle} className={cn(className, "hover:bg-muted")} aria-expanded={open}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
