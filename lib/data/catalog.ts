// Entities shared by the seed data, the grammar (runtime options), and the UI.
// Order matters: it fixes each entity's chart color everywhere.

export const channels = [
  { key: "email", label: "Email" },
  { key: "voice", label: "Voice" },
  { key: "website", label: "Website" },
  { key: "phoneToText", label: "Phone to text" },
  { key: "sms", label: "SMS" },
] as const;

export const reps = [
  { key: "sara", label: "Sara Okafor" },
  { key: "marcus", label: "Marcus Bell" },
  { key: "priya", label: "Priya Nair" },
  { key: "diego", label: "Diego Alvarez" },
  { key: "hannah", label: "Hannah Cho" },
  { key: "tom", label: "Tom Reyes" },
] as const;

export const sources = [
  { key: "googleAds", label: "Google Ads" },
  { key: "referral", label: "Referral" },
  { key: "organic", label: "Organic" },
  { key: "event", label: "Event" },
  { key: "partner", label: "Partner" },
] as const;

export const stages = [
  { key: "lead", label: "New lead" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
] as const;

export type ChannelKey = (typeof channels)[number]["key"];
export type RepKey = (typeof reps)[number]["key"];
export type SourceKey = (typeof sources)[number]["key"];
export type StageKey = (typeof stages)[number]["key"];

export const dimensions = { channel: channels, rep: reps, source: sources, stage: stages } as const;
export type Dimension = keyof typeof dimensions;

export function labelOf(dimension: Dimension, key: string): string {
  return dimensions[dimension].find((e) => e.key === key)?.label ?? key;
}

export function colorIndexOf(dimension: Dimension, key: string): number {
  const i = dimensions[dimension].findIndex((e) => e.key === key);
  return i < 0 ? 0 : i;
}
