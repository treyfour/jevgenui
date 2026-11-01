"use server";

import type { Decision } from "@/lib/decision";
import { axisDef, specAxes, type ViewSpec } from "@/lib/grammar";
import { decide } from "@/lib/jev";

const MAX_REQUEST_LENGTH = 300;

/** previousView comes from the client: keep it only if every value is a real option. */
function sanitize(view: ViewSpec | null): ViewSpec | null {
  if (!view || typeof view !== "object") return null;
  const valid = specAxes.every((axis) => typeof view[axis] === "string" && Object.hasOwn(axisDef(axis).options, view[axis]));
  return valid ? (Object.fromEntries(specAxes.map((axis) => [axis, view[axis]])) as ViewSpec) : null;
}

export type AskResult = { ok: true; decision: Decision } | { ok: false; error: string };

/** The only server round trip: ask Jev what to build. Everything after this is client-side. */
export async function ask(request: string, previousView: ViewSpec | null): Promise<AskResult> {
  const text = typeof request === "string" ? request.trim().slice(0, MAX_REQUEST_LENGTH) : "";
  if (!text) return { ok: false, error: "Ask a question about your leads, deals, or revenue." };
  try {
    return { ok: true, decision: await decide({ request: text, previousView: sanitize(previousView) }) };
  } catch (error) {
    console.error("[ask] Jev request failed", error);
    return { ok: false, error: "Jev didn't answer. Try again in a moment." };
  }
}
