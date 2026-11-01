// How the interface treats uncertainty. Gate on Jev's confidence (how concentrated the
// distribution is); display the top probability. Tuned against scripts/eval.mts.

import type { Axis } from "@/lib/grammar";

export const HIGH_CONFIDENCE = 0.8;
export const LOW_CONFIDENCE = 0.5;

export type Tier = "high" | "medium" | "low";

export function tierOf(confidence: number): Tier {
  if (confidence >= HIGH_CONFIDENCE) return "high";
  if (confidence >= LOW_CONFIDENCE) return "medium";
  return "low";
}

/** Below this probability of a clear ask, the UI asks instead of rendering a guess. */
export const CLEAR_THRESHOLD = 0.5;

/** Below LOW_CONFIDENCE on these, the UI asks instead of rendering a guess. */
export const clarifyAxes = ["metric", "chart"] as const satisfies readonly Axis[];

/** At medium confidence on these, the UI offers the runner-up inline. */
export const alternativeAxes = ["metric", "chart", "splitBy", "range", "focus", "compare"] as const satisfies readonly Axis[];

export type AxisAnswer = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

/** Options sorted by probability, highest first. */
export function ranked(answer: AxisAnswer): { key: string; p: number }[] {
  return Object.entries(answer.probabilities)
    .map(([key, p]) => ({ key, p }))
    .sort((a, b) => b.p - a.p);
}
