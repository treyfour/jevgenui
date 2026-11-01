// Every sentence on the card is a template filled from query results. No model writes
// copy, so no number can be invented.

import { labelOf, type Dimension } from "@/lib/data/catalog";
import type { ViewData } from "@/lib/data/query";
import { optionLabel, type ViewSpec } from "@/lib/grammar";

// "for the last 7 days" and "in the last 7 days" read differently from "today".
const rangeFor: Record<ViewSpec["range"], string> = {
  today: "today",
  last7: "the last 7 days",
  thisMonth: "this month",
  thisQuarter: "this quarter",
};
const rangeIn: Record<ViewSpec["range"], string> = { ...rangeFor, last7: "in the last 7 days" };

const dimensionPlural: Record<Dimension, string> = { channel: "channels", rep: "reps", source: "sources", stage: "stages" };

export function formatValue(metric: ViewSpec["metric"], n: number): string {
  if (metric !== "revenue") return Math.round(n).toLocaleString("en-US");
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function noun(metric: ViewSpec["metric"], n: number): string {
  if (metric === "revenue") return "in revenue";
  return n === 1 ? metric.slice(0, -1) : metric;
}

function focusPhrase(focus: string): string {
  if (focus === "none") return "";
  const [dim, key] = focus.split(":");
  return dim === "rep" ? ` for ${labelOf("rep", key)}` : ` from ${labelOf("channel", key)}`;
}

function focusTitle(focus: string): string {
  return focus === "none" ? "" : ` · ${optionLabel("focus", focus)}`;
}

function delta(cur: number, prev: number | undefined): string {
  if (prev === undefined) return "";
  if (prev === 0) return cur === 0 ? " Flat versus the previous period." : " Up from zero in the previous period.";
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return " Flat versus the previous period.";
  return ` ${pct > 0 ? "Up" : "Down"} ${Math.abs(pct)}% versus the previous period.`;
}

export function titleFor(spec: ViewSpec, data: ViewData): string {
  const metric = optionLabel("metric", spec.metric);
  switch (data.kind) {
    case "breakdown":
      return `${metric} by ${optionLabel("splitBy", data.dimension).toLowerCase()}${focusTitle(spec.focus)}`;
    case "ranking":
      return `Top ${dimensionPlural[data.dimension]} by ${metric.toLowerCase()}${focusTitle(spec.focus)}`;
    case "trend":
      return `${metric} trend · ${optionLabel("range", spec.range)}${focusTitle(spec.focus)}`;
    case "funnel":
      return `Lead funnel${focusTitle(spec.focus)}`;
    case "headline":
      return `${metric} · ${optionLabel("range", spec.range)}${focusTitle(spec.focus)}`;
  }
}

export function summaryFor(spec: ViewSpec, data: ViewData): string {
  const m = spec.metric;
  const range = rangeIn[spec.range];
  const focus = focusPhrase(spec.focus);
  const fmt = (n: number) => formatValue(m, n);

  switch (data.kind) {
    case "breakdown": {
      const [top] = data.items;
      if (!top || data.total === 0) return `No ${m} ${range}${focus} yet.`;
      const share = Math.round((top.value / data.total) * 100);
      const lead = share >= 50 ? `${top.label} is driving the majority at ${share}%.` : `${top.label} leads with ${share}%.`;
      return `Here's your ${m} for ${rangeFor[spec.range]}${focus}. ${lead}${delta(data.total, data.prevTotal)}`;
    }
    case "ranking": {
      const [top, second] = data.items;
      if (!top || top.value === 0) return `No ${m} ${range}${focus} yet.`;
      const gap = second ? `, ${fmt(top.value - second.value)} more than ${second.label}` : "";
      return `${top.label} comes first ${range}${focus} with ${fmt(top.value)} ${noun(m, top.value)}${gap}.${delta(data.total, data.prevTotal)}`;
    }
    case "trend": {
      if (data.total === 0) return `No ${m} ${range}${focus} yet.`;
      const peak = data.points.reduce((a, b) => (b.value > a.value ? b : a));
      // Buckets are hours for today, weeks for the quarter, days otherwise.
      const when = spec.range === "today" ? `at ${peak.label}` : spec.range === "thisQuarter" ? `the week of ${peak.label}` : `on ${peak.label}`;
      return `${fmt(data.total)} ${noun(m, data.total)} ${range}${focus}, peaking at ${fmt(peak.value)} ${when}.${delta(data.total, data.prevTotal)}`;
    }
    case "funnel": {
      const first = data.steps[0]?.value ?? 0;
      if (first === 0) return `No leads ${range}${focus} yet.`;
      const won = data.steps[data.steps.length - 1].value;
      let worst = { from: "", to: "", loss: -1 };
      for (let i = 1; i < data.steps.length; i++) {
        const prev = data.steps[i - 1].value;
        const loss = prev === 0 ? 0 : 1 - data.steps[i].value / prev;
        if (loss > worst.loss) worst = { from: data.steps[i - 1].label, to: data.steps[i].label, loss };
      }
      return `${Math.round((won / first) * 100)}% of leads created ${range}${focus} reached Won. The biggest drop is ${worst.from} → ${worst.to}, losing ${Math.round(worst.loss * 100)}%.`;
    }
    case "headline": {
      if (data.total === 0) return `No ${m} ${range}${focus} yet.`;
      return `${fmt(data.total)} ${noun(m, data.total)} ${range}${focus}.${delta(data.total, data.prevTotal)}`;
    }
  }
}

/** The question the Drill down action sends: one level deeper into the top segment. */
export function drillDownQuestion(spec: ViewSpec, data: ViewData): string {
  const range = rangeIn[spec.range];
  if ((data.kind === "breakdown" || data.kind === "ranking") && data.items[0]) {
    const top = data.items[0];
    if (data.dimension === "rep") return `How did ${top.label}'s ${spec.metric} trend ${range}?`;
    if (data.dimension === "channel") return `How did ${spec.metric} from ${top.label} trend ${range}?`;
    return `Which reps had the most ${spec.metric} ${range}?`;
  }
  if (data.kind === "funnel") return `Which channels brought the most leads ${range}?`;
  return `Where did ${spec.metric} come from ${range}?`;
}
