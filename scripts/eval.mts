// Runs the brief's test set through Jev and prints each axis against expectations.
//   npx tsx --conditions=react-server --env-file=.env.local scripts/eval.mts [--shuffle]
// --shuffle also asks with every option list reversed and flags answers that flip,
// which exposes first-option bias in the grammar.

import { decide, type AskInput } from "@/lib/jev";
import { axisOrder, optionLabel, type Axis, type ViewSpec } from "@/lib/grammar";
import { ranked } from "@/lib/policy";
import { alternativesFor, clarifyFor } from "@/lib/turn";
import { specFrom, type Decision } from "@/lib/decision";
import { generateDataset } from "@/lib/data/seed";
import { query } from "@/lib/data/query";
import { resolveSpec } from "@/lib/resolve";
import { summaryFor, titleFor } from "@/lib/copy";

const dataset = generateDataset();

type Case = { request: string; expect: Partial<Record<Axis, string>>; behavior?: "clarify" | "hedge" | "silent"; previousView?: ViewSpec };

const cases: Case[] = [
  { request: "Where did leads come from this week?", expect: { metric: "leads", chart: "breakdown", splitBy: "channel", range: "last7", nextStep: "save" } },
  { request: "Which reps closed the most deals this quarter?", expect: { metric: "deals", chart: "ranking", splitBy: "rep", range: "thisQuarter", nextStep: "share" } },
  { request: "How did revenue trend this month?", expect: { metric: "revenue", chart: "trend", splitBy: "none", range: "thisMonth", compare: "none" } },
  { request: "Where do leads drop off?", expect: { metric: "leads", chart: "funnel", nextStep: "drillDown" } },
  { request: "How many deals did we close today?", expect: { metric: "deals", chart: "headline", range: "today" } },
  { request: "Is email doing better than last month?", expect: { compare: "previousPeriod", focus: "channel:email" } },
  // Leads vs deals is a coin flip for "pipeline", but a funnel always tracks leads, so the
  // view is fully determined and the UI rightly doesn't hedge.
  { request: "Show me Sara's pipeline", expect: { focus: "rep:sara", chart: "funnel" }, behavior: "silent" },
  { request: "leads", expect: { metric: "leads" }, behavior: "clarify" },
  { request: "How much revenue did we book this month?", expect: { metric: "revenue", chart: "headline", range: "thisMonth" } },
  {
    // Context must not override a measure the request names.
    request: "Where do leads drop off?",
    expect: { metric: "leads", chart: "funnel" },
    previousView: { metric: "revenue", chart: "trend", splitBy: "none", range: "thisMonth", compare: "none", focus: "none" },
  },
  {
    request: "now split that by rep",
    expect: { metric: "leads", splitBy: "rep", range: "last7" },
    previousView: { metric: "leads", chart: "breakdown", splitBy: "channel", range: "last7", compare: "none", focus: "none" },
  },
];

const shuffle = process.argv.includes("--shuffle");
const reverse: AskInput["order"] = (keys) => [...keys].reverse();

/** What the UI will actually do, using the same functions the UI uses. */
function behaviorOf(d: Decision): string {
  if (clarifyFor(d, {})) return "clarify";
  const alternatives = alternativesFor(d, {}, resolveSpec(specFrom(d)).coerced);
  return alternatives.length ? `hedge(${alternatives.map((a) => a.axis).join(",")})` : "silent";
}

let pass = 0;
let total = 0;
let flips = 0;
let latency = 0;
let cost = 0;

for (const c of cases) {
  const d = await decide({ request: c.request, previousView: c.previousView });
  const r = shuffle ? await decide({ request: c.request, previousView: c.previousView, order: reverse }) : null;
  latency += d.latencyMs;
  cost += d.costUsd;

  const behavior = behaviorOf(d);
  console.log(`\n▸ "${c.request}"   ${d.latencyMs}ms  ${d.inputTokens} tok  clear ${(d.clarity * 100).toFixed(0)}%  → ${behavior}`);
  for (const axis of axisOrder) {
    const a = d.answers[axis];
    const want = c.expect[axis];
    const ok = want === undefined ? " " : want === a.choice ? "✓" : "✗";
    if (want !== undefined) {
      total++;
      if (ok === "✓") pass++;
    }
    const [, second] = ranked(a);
    const runnerUp = second ? `  (2nd ${optionLabel(axis, second.key)} ${(second.p * 100).toFixed(0)}%)` : "";
    const flipped = r && r.answers[axis].choice !== a.choice ? `  ⟲ reversed→${optionLabel(axis, r.answers[axis].choice)}` : "";
    if (flipped) flips++;
    console.log(
      `  ${ok} ${axis.padEnd(9)} ${optionLabel(axis, a.choice).padEnd(44).slice(0, 44)} conf ${a.confidence.toFixed(2)} p ${(a.probabilities[a.choice] * 100).toFixed(0).padStart(3)}%${runnerUp}${want && ok === "✗" ? `  want ${want}` : ""}${flipped}`,
    );
  }
  const { spec, coerced } = resolveSpec(specFrom(d));
  const data = query(spec, dataset);
  for (const [axis, why] of Object.entries(coerced)) console.log(`  ⚙ ${axis} → ${optionLabel(axis as Axis, spec[axis as keyof ViewSpec])} (${why})`);
  console.log(`  ▣ ${titleFor(spec, data)} — ${summaryFor(spec, data)}`);
  if (c.behavior) {
    const met = behavior.startsWith(c.behavior);
    total++;
    if (met) pass++;
    console.log(`  ${met ? "✓" : "✗"} behavior  expected ${c.behavior}`);
  }
}

console.log(`\n${pass}/${total} expectations met · avg ${Math.round(latency / cases.length)}ms · total $${cost.toFixed(6)}${shuffle ? ` · ${flips} answers flipped when reversed` : ""}`);
