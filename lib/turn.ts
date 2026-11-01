// Everything a turn displays, derived from Jev's decision plus the user's overrides.
// Pure, so an override re-renders instantly with no network.

import { summaryFor, titleFor } from "@/lib/copy";
import { query } from "@/lib/data/query";
import type { Dataset } from "@/lib/data/seed";
import { specFrom, type Decision, type Overrides } from "@/lib/decision";
import { optionLabel, type Axis } from "@/lib/grammar";
import { alternativeAxes, CLEAR_THRESHOLD, clarifyAxes, ranked, tierOf } from "@/lib/policy";
import { resolveSpec } from "@/lib/resolve";

export type Turn = {
  id: string;
  text: string;
  status: "pending" | "done" | "error";
  decision?: Decision;
  overrides: Overrides;
  error?: string;
};

export function deriveView(decision: Decision, overrides: Overrides, ds: Dataset) {
  const { spec, coerced } = resolveSpec(specFrom(decision, overrides));
  const data = query(spec, ds);
  return { spec, coerced, data, title: titleFor(spec, data), summary: summaryFor(spec, data) };
}

/**
 * Whether Jev's runner-up on this axis would produce a different view. When code fixes the
 * axis (a funnel always tracks leads), its uncertainty is irrelevant: don't ask, don't offer.
 */
function runnerUpChangesView(decision: Decision, overrides: Overrides, axis: Axis) {
  const [, second] = ranked(decision.answers[axis]);
  if (!second) return false;
  const current = resolveSpec(specFrom(decision, overrides)).spec;
  const next = resolveSpec(specFrom(decision, { ...overrides, [axis]: second.key })).spec;
  return JSON.stringify(next) !== JSON.stringify(current);
}

/** When Jev can't tell what view is wanted, the axis to ask about and its top options. */
export function clarifyFor(decision: Decision, overrides: Overrides) {
  const uncertain = clarifyAxes.find(
    (a) => tierOf(decision.answers[a].confidence) === "low" && overrides[a] === undefined && runnerUpChangesView(decision, overrides, a),
  );
  const axis = uncertain ?? (decision.clarity < CLEAR_THRESHOLD && overrides.chart === undefined ? "chart" : null);
  return axis ? { axis, options: ranked(decision.answers[axis]).slice(0, 3) } : null;
}

/** Uncertain picks the user hasn't touched, each with Jev's runner-up, when it would matter. */
export function alternativesFor(decision: Decision, overrides: Overrides, coerced: Partial<Record<Axis, string>>) {
  return alternativeAxes
    .filter((axis) => tierOf(decision.answers[axis].confidence) !== "high")
    .filter((axis) => overrides[axis] === undefined && coerced[axis] === undefined)
    .filter((axis) => runnerUpChangesView(decision, overrides, axis))
    .map((axis) => {
      const [first, second] = ranked(decision.answers[axis]);
      return { axis, current: first.key, runnerUp: second.key };
    })
    .slice(0, 2);
}

export function nextStepOf(decision: Decision, overrides: Overrides) {
  return overrides.nextStep ?? decision.answers.nextStep.choice;
}

export function followUpsOf(decision: Decision): string[] {
  return ranked(decision.answers.followUp)
    .slice(0, 2)
    .map((o) => optionLabel("followUp", o.key));
}
