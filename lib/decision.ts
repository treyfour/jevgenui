// A turn's decision: Jev's raw answers plus the user's overrides. The view spec is always
// derived from these two, never stored, so the model and the user edit the same thing.

import { axisOrder, type Axis, type SpecAxis, type ViewSpec } from "@/lib/grammar";
import type { AxisAnswer } from "@/lib/policy";

export type Decision = {
  answers: Record<Axis, AxisAnswer>;
  /** Probability that the request is specific enough to pick a view. */
  clarity: number;
  latencyMs: number;
  inputTokens: number;
  costUsd: number;
  model: string;
};

export type Overrides = Partial<Record<Axis, string>>;

// Every axis plus the clarity gate.
export const questionCount = axisOrder.length + 1;

export function specFrom(decision: Decision, overrides: Overrides = {}): ViewSpec {
  const pick = (axis: SpecAxis) => overrides[axis] ?? decision.answers[axis].choice;
  return {
    metric: pick("metric"),
    chart: pick("chart"),
    splitBy: pick("splitBy"),
    range: pick("range"),
    compare: pick("compare"),
    focus: pick("focus"),
  } as ViewSpec;
}
