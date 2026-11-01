// The GenUI grammar: every axis of the interface Jev can steer, and every value it can
// pick. This file is the design. Jev only ever selects from what is written here; code
// renders the result. Option order is deliberate: Jev leans toward the first option, so
// the safest default goes first.

import { channels, reps } from "@/lib/data/catalog";
import { followUpBank } from "@/lib/followups";

export type OptionDef = {
  label: string;
  covers: string;
  excludes?: string;
};

type AxisDef = {
  label: string;
  instructions: string;
  options: Record<string, OptionDef>;
};

export const staticAxes = {
  metric: {
    label: "Metric",
    instructions:
      "Which measure is the user asking about in `request`? A measure named in `request` (leads, deals, revenue, or a synonym) always wins. Only when `request` names none and continues `previous_view`, keep that one.",
    options: {
      leads: {
        label: "Leads",
        covers: "New inbound prospects or inquiries; where they came from; how many arrived; pipeline progress of prospects",
        excludes: "Closed sales or money",
      },
      deals: {
        label: "Deals",
        covers: "Won or closed sales counted one by one; which reps closed the most; number of wins",
        excludes: "Dollar amounts",
      },
      revenue: {
        label: "Revenue",
        covers: "Money from won deals: sales dollars, bookings, income, amount sold",
      },
    },
  },
  chart: {
    label: "Chart",
    instructions:
      "Which kind of view best answers `request`? Choose by the shape of the answer the user wants, not by the measure.",
    options: {
      breakdown: {
        label: "Breakdown",
        covers: "How a total splits into parts: where something came from, the mix, the share of each part",
        excludes: "Who or which is the top performer; change over time",
      },
      ranking: {
        label: "Ranking",
        covers: "Ordering by size to find the top or bottom: who closed the most, best or worst, top performers, compare members side by side",
        excludes: "Change over time",
      },
      trend: {
        label: "Trend",
        covers: "How something changed over time: trend, growth, decline, pace, momentum, day by day",
      },
      funnel: {
        label: "Funnel",
        covers: "Progress through sequential pipeline stages: conversion, where prospects drop off, stage-to-stage loss",
      },
      headline: {
        label: "Headline number",
        covers: "A single total answers it: how many, how much, what is the count",
        excludes: "Requests that ask for a split, ranking, or change over time",
      },
    },
  },
  splitBy: {
    label: "Split by",
    instructions:
      "Which grouping does `request` ask to break the measure down by? Choose none when it asks for a single total, a trend, or nothing grouped.",
    options: {
      channel: {
        label: "Channel",
        covers: "How the prospect reached us: email, voice call, website form, phone to text, SMS; where leads came from",
      },
      rep: {
        label: "Rep",
        covers: "Sales reps, people, team members, who owns or closed it",
      },
      source: {
        label: "Source",
        covers: "Marketing source or campaign: Google Ads, referral, organic, event, partner",
      },
      stage: {
        label: "Stage",
        covers: "Pipeline stage: new, qualified, proposal, negotiation, won",
      },
      none: {
        label: "No split",
        covers: "A single total or a trend line with no grouping",
      },
    },
  },
  range: {
    label: "Range",
    instructions:
      "Which time window does `request` refer to, given that today is `today`? If no time is mentioned, choose the last 7 days. For a follow-up with no time, keep `previous_view`'s range.",
    options: {
      last7: {
        label: "Last 7 days",
        covers: "This week, past week, last few days, recently",
      },
      today: {
        label: "Today",
        covers: "The current day only: today, so far today, this morning",
      },
      thisMonth: {
        label: "This month",
        covers: "This month, month to date, the past few weeks, last 30 days",
      },
      thisQuarter: {
        label: "This quarter",
        covers: "This quarter, quarter to date, Q4, the last three months",
      },
    },
  },
  compare: {
    label: "Compare",
    instructions: "Does `request` explicitly name an earlier period to compare against?",
    options: {
      none: {
        label: "No comparison",
        covers: "No earlier period is named, including plain questions about a trend or growth over the current range",
      },
      previousPeriod: {
        label: "Previous period",
        covers: "Names an earlier period to measure against: versus last week, last month, last quarter; better or worse than before",
      },
    },
  },
  nextStep: {
    label: "Next step",
    instructions: "After seeing the answer to `request`, which action is the user most likely to want next?",
    options: {
      save: {
        label: "Save",
        covers: "A routine status check worth revisiting every week: lead sources, totals, standard breakdowns",
      },
      share: {
        label: "Share",
        covers: "A result someone else needs: team rankings, revenue booked, wins to celebrate or report upward",
      },
      setAlert: {
        label: "Set alert",
        covers: "A number to keep watching: today's counts, a single channel or rep, a comparison against before",
      },
      drillDown: {
        label: "Drill down",
        covers: "The answer raises a why: drop-offs, losses, declines, problems worth investigating",
        excludes: "Routine counts and breakdowns",
      },
    },
  },
} as const satisfies Record<string, AxisDef>;

export type StaticAxis = keyof typeof staticAxes;
export type OptionOf<A extends StaticAxis> = keyof (typeof staticAxes)[A]["options"] & string;

// A yes/no gate asked alongside the axes. Confidence says how concentrated an answer is,
// not whether the request was vague: "leads" confidently reads as a headline count. So
// vagueness gets its own judgment.
export const clarityQuestion = {
  label: "Clear ask",
  instructions:
    "Does `request` say what the user wants to learn (a total, a split, a ranking, a change over time, or a conversion), rather than only naming a topic? A follow-up to `previous_view` counts as clear.",
  criteria: {
    true: "A question or an instruction, even a short one such as show me someone's pipeline",
    false: "A bare topic with no question or instruction, such as a metric name on its own",
  },
} as const;

// Runtime axes: their options come from data, not from this file.

export function focusAxis(): AxisDef {
  const options: Record<string, OptionDef> = {
    none: { label: "Everyone", covers: "No specific person or channel is singled out; the whole team" },
  };
  for (const r of reps) {
    options[`rep:${r.key}`] = {
      label: r.label,
      covers: `Only ${r.label}'s own work: their leads, deals, revenue, or pipeline`,
    };
  }
  for (const c of channels) {
    options[`channel:${c.key}`] = {
      label: c.label,
      covers: `Only the ${c.label} channel`,
      excludes: `Comparing ${c.label} against the other channels`,
    };
  }
  return {
    label: "Focus",
    instructions:
      "Does `request` single out one specific rep or one specific channel to look at on its own? A name like Sara refers to that rep.",
    options,
  };
}

export function followUpAxis(asked: string): AxisDef {
  const normalized = asked.trim().toLowerCase().replace(/[?.!]+$/, "");
  const options: Record<string, OptionDef> = {};
  followUpBank.forEach((q, i) => {
    if (q.toLowerCase().replace(/[?.!]+$/, "") === normalized) return;
    options[`q${i}`] = { label: q, covers: q };
  });
  return {
    label: "Follow-ups",
    instructions:
      "Which question would be the most useful next thing for the user to ask after `request`? Prefer a different angle on the same topic.",
    options,
  };
}

export const axisOrder = ["metric", "chart", "splitBy", "range", "focus", "compare", "nextStep", "followUp"] as const;
export type Axis = (typeof axisOrder)[number];

export type ViewSpec = {
  metric: OptionOf<"metric">;
  chart: OptionOf<"chart">;
  splitBy: OptionOf<"splitBy">;
  range: OptionOf<"range">;
  compare: OptionOf<"compare">;
  focus: string;
};

export const specAxes = ["metric", "chart", "splitBy", "range", "focus", "compare"] as const satisfies readonly Axis[];
export type SpecAxis = (typeof specAxes)[number];

/** The full axis definition for any axis, including runtime ones. */
export function axisDef(axis: Axis, asked = ""): AxisDef {
  if (axis === "focus") return focusAxis();
  if (axis === "followUp") return followUpAxis(asked);
  return staticAxes[axis];
}

export function optionLabel(axis: Axis, key: string): string {
  if (axis === "followUp") return followUpBank[Number(key.slice(1))] ?? key;
  return axisDef(axis).options[key]?.label ?? key;
}
