// spec → numbers. Pure and synchronous: every number on screen comes from here, never
// from the model.

import { colorIndexOf, dimensions, labelOf, stages, type Dimension } from "@/lib/data/catalog";
import { dateOf, dayNumber, type Dataset, type Lead } from "@/lib/data/seed";
import type { ViewSpec } from "@/lib/grammar";

export type Item = { key: string; label: string; value: number; prev?: number; color: number };
export type Point = { label: string; value: number; prev?: number };
export type Step = { key: string; label: string; value: number };

export type ViewData =
  | { kind: "breakdown" | "ranking"; dimension: Dimension; items: Item[]; total: number; prevTotal?: number }
  | { kind: "trend"; points: Point[]; total: number; prevTotal?: number }
  | { kind: "funnel"; steps: Step[] }
  | { kind: "headline"; total: number; prevTotal?: number };

type Window = { from: number; to: number; maxHour?: number };

export function windows(range: ViewSpec["range"], ds: Dataset): { current: Window; previous: Window } {
  const t = ds.today;
  const now = dateOf(t);
  switch (range) {
    case "today":
      return { current: { from: t, to: t }, previous: { from: t - 1, to: t - 1, maxHour: ds.nowHour } };
    case "last7":
      return { current: { from: t - 6, to: t }, previous: { from: t - 13, to: t - 7 } };
    case "thisMonth": {
      const from = dayNumber(new Date(now.getFullYear(), now.getMonth(), 1));
      const prevFrom = dayNumber(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      return { current: { from, to: t }, previous: { from: prevFrom, to: Math.min(prevFrom + (t - from), from - 1) } };
    }
    case "thisQuarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      const from = dayNumber(new Date(now.getFullYear(), q, 1));
      const prevFrom = dayNumber(new Date(now.getFullYear(), q - 3, 1));
      return { current: { from, to: t }, previous: { from: prevFrom, to: Math.min(prevFrom + (t - from), from - 1) } };
    }
  }
}

function inWindow(day: number, hour: number, w: Window) {
  return day >= w.from && day <= w.to && (w.maxHour === undefined || hour <= w.maxHour);
}

/** The rows a metric counts in a window, with each row's day (lead created, or deal won) and weight. */
function rows(ds: Dataset, spec: ViewSpec, w: Window): { lead: Lead; day: number; weight: number }[] {
  const [focusDim, focusKey] = spec.focus === "none" ? [] : spec.focus.split(":");
  const out: { lead: Lead; day: number; weight: number }[] = [];
  for (const lead of ds.leads) {
    if (focusDim === "rep" && lead.rep !== focusKey) continue;
    if (focusDim === "channel" && lead.channel !== focusKey) continue;
    if (spec.metric === "leads") {
      if (inWindow(lead.day, lead.hour, w)) out.push({ lead, day: lead.day, weight: 1 });
    } else if (lead.wonDay !== undefined && inWindow(lead.wonDay, lead.hour, w)) {
      out.push({ lead, day: lead.wonDay, weight: spec.metric === "revenue" ? lead.amount ?? 0 : 1 });
    }
  }
  return out;
}

const sum = (rs: { weight: number }[]) => rs.reduce((a, r) => a + r.weight, 0);

export function query(spec: ViewSpec, ds: Dataset): ViewData {
  const { current, previous } = windows(spec.range, ds);
  const cur = rows(ds, spec, current);
  const prev = spec.compare === "previousPeriod" ? rows(ds, spec, previous) : null;

  switch (spec.chart) {
    case "breakdown":
    case "ranking": {
      const dimension = spec.splitBy === "none" ? "channel" : spec.splitBy;
      const group = (rs: typeof cur) => {
        const m = new Map<string, number>();
        for (const r of rs) {
          const key = r.lead[dimension];
          m.set(key, (m.get(key) ?? 0) + r.weight);
        }
        return m;
      };
      const g = group(cur);
      const pg = prev ? group(prev) : null;
      const items = dimensions[dimension]
        .map((e) => ({
          key: e.key,
          label: labelOf(dimension, e.key),
          value: g.get(e.key) ?? 0,
          prev: pg ? pg.get(e.key) ?? 0 : undefined,
          color: colorIndexOf(dimension, e.key),
        }))
        .sort((a, b) => b.value - a.value);
      return { kind: spec.chart, dimension, items, total: sum(cur), prevTotal: prev ? sum(prev) : undefined };
    }
    case "trend": {
      const points = buckets(spec.range, current, ds).map((b, i) => {
        const value = sum(cur.filter((r) => b.match(r.day, r.lead.hour)));
        let prevValue: number | undefined;
        if (prev) {
          const pb = buckets(spec.range, previous, ds)[i];
          prevValue = pb ? sum(prev.filter((r) => pb.match(r.day, r.lead.hour))) : undefined;
        }
        return { label: b.label, value, prev: prevValue };
      });
      return { kind: "trend", points, total: sum(cur), prevTotal: prev ? sum(prev) : undefined };
    }
    case "funnel": {
      const reached = (i: number) => cur.filter((r) => stages.findIndex((s) => s.key === r.lead.stage) >= i).length;
      return { kind: "funnel", steps: stages.map((s, i) => ({ key: s.key, label: s.label, value: reached(i) })) };
    }
    case "headline":
      return { kind: "headline", total: sum(cur), prevTotal: prev ? sum(prev) : undefined };
  }
}

type Bucket = { label: string; match: (day: number, hour: number) => boolean };

function buckets(range: ViewSpec["range"], w: Window, ds: Dataset): Bucket[] {
  const out: Bucket[] = [];
  if (range === "today") {
    const last = w.maxHour ?? ds.nowHour;
    for (let h = 7; h <= Math.max(7, last); h++) {
      out.push({ label: `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`, match: (d, hr) => d === w.from && hr === h });
    }
    return out;
  }
  const step = range === "thisQuarter" ? 7 : 1;
  for (let d = w.from; d <= w.to; d += step) {
    const date = dateOf(d);
    const label =
      range === "last7"
        ? date.toLocaleDateString("en-US", { weekday: "short" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = Math.min(d + step - 1, w.to);
    out.push({ label, match: (day) => day >= d && day <= end });
  }
  return out;
}
