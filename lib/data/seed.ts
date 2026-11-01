// A deterministic fake CRM, generated in the browser. Same seed, same pipeline; anchored to
// today so "today" and "this week" always have data.

import { channels, reps, sources, stages, type ChannelKey, type RepKey, type SourceKey, type StageKey } from "@/lib/data/catalog";

export type Lead = {
  day: number; // local days since epoch
  hour: number;
  channel: ChannelKey;
  source: SourceKey;
  rep: RepKey;
  /** Furthest pipeline stage reached. */
  stage: StageKey;
  /** Set when stage is "won". */
  amount?: number;
  wonDay?: number;
};

export type Dataset = { today: number; nowHour: number; leads: Lead[] };

const HISTORY_DAYS = 200; // covers this quarter plus the previous one for comparisons

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rand: () => number, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function dayNumber(date: Date): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

export function dateOf(day: number): Date {
  const d = new Date(day * 86_400_000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const channelWeights = [55, 15, 18, 8, 4];
const sourceWeights = [34, 18, 26, 12, 10];
const repWeights = [20, 18, 17, 16, 15, 14];
// Chance of advancing past each stage, by channel: website and voice convert better.
const advance: Record<ChannelKey, number[]> = {
  email: [0.4, 0.5, 0.55, 0.45],
  voice: [0.6, 0.6, 0.6, 0.55],
  website: [0.55, 0.6, 0.62, 0.55],
  phoneToText: [0.45, 0.5, 0.5, 0.45],
  sms: [0.3, 0.4, 0.5, 0.4],
};
const repDealSize: Record<RepKey, number> = { sara: 1.25, marcus: 1.0, priya: 1.15, diego: 0.9, hannah: 1.05, tom: 0.85 };

export function generateDataset(now = new Date(), seed = 20261030): Dataset {
  const rand = mulberry32(seed);
  const today = dayNumber(now);
  const nowHour = now.getHours();
  const leads: Lead[] = [];

  for (let ago = HISTORY_DAYS; ago >= 0; ago--) {
    const day = today - ago;
    const weekday = dateOf(day).getDay();
    const weekend = weekday === 0 || weekday === 6;
    const growth = 1 + (HISTORY_DAYS - ago) / HISTORY_DAYS / 3;
    const count = Math.round((weekend ? 14 : 36) * growth * (0.75 + rand() * 0.5));

    for (let i = 0; i < count; i++) {
      const hour = Math.min(21, Math.max(7, Math.round(8 + rand() * 6 + rand() * 6)));
      if (ago === 0 && hour > nowHour) continue;
      const channel = weighted(rand, channels.map((c) => c.key), channelWeights);
      const lead: Lead = {
        day,
        hour,
        channel,
        source: weighted(rand, sources.map((s) => s.key), sourceWeights),
        rep: weighted(rand, reps.map((r) => r.key), repWeights),
        stage: "lead",
      };
      let s = 0;
      while (s < 4 && rand() < advance[channel][s]) s++;
      if (s === 4) {
        const wonDay = day + Math.floor(rand() * 10);
        // A win that would land in the future is still in negotiation today.
        if (wonDay > today) s = 3;
        else {
          lead.wonDay = wonDay;
          lead.amount = Math.round((1800 + rand() * 4200 + rand() * rand() * 9000) * repDealSize[lead.rep]);
        }
      }
      lead.stage = stages[s].key;
      leads.push(lead);
    }
  }
  return { today, nowHour, leads };
}
