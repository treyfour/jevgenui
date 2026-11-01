// Jev picks each axis independently, so some combinations don't make a valid view.
// Code repairs them here and records why, so the interface can show who decided what.

import type { SpecAxis, ViewSpec } from "@/lib/grammar";

export type Coercions = Partial<Record<SpecAxis, string>>;

export function resolveSpec(input: ViewSpec): { spec: ViewSpec; coerced: Coercions } {
  const spec = { ...input };
  const coerced: Coercions = {};
  const set = <A extends SpecAxis>(axis: A, value: ViewSpec[A], why: string) => {
    if (spec[axis] === value) return;
    spec[axis] = value;
    coerced[axis] = why;
  };

  if (spec.chart === "funnel") {
    set("metric", "leads", "Funnels follow leads through the pipeline");
    set("splitBy", "stage", "Funnels are always split by stage");
    set("compare", "none", "Funnels don't compare periods yet");
  }
  if (spec.chart === "trend" || spec.chart === "headline") {
    set("splitBy", "none", "This view shows a single total");
  }
  if (spec.chart === "breakdown" || spec.chart === "ranking") {
    // Fill a missing grouping first, so the focus checks below also see the default.
    if (spec.splitBy === "none") {
      set("splitBy", spec.metric === "leads" ? "channel" : "rep", "This view needs a grouping");
    }
    if (spec.splitBy === "stage" && spec.metric !== "leads") {
      set("splitBy", "rep", "Closed deals all sit in the Won stage");
    }
    if (spec.focus.startsWith("rep:") && spec.splitBy === "rep") {
      set("splitBy", "channel", "Already focused on one rep");
    }
    if (spec.focus.startsWith("channel:") && spec.splitBy === "channel") {
      set("splitBy", "rep", "Already focused on one channel");
    }
  }
  return { spec, coerced };
}
