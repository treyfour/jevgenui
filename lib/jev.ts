import "server-only";

import { choice, noul, TypeSafeClient, type ChoiceQuestion, type NoulQuestion } from "@typesafe-ai/sdk";
import type { Decision } from "@/lib/decision";
import { axisDef, axisOrder, clarityQuestion, optionLabel, specAxes, type Axis, type ViewSpec } from "@/lib/grammar";
import type { AxisAnswer } from "@/lib/policy";

// Input tokens are billed at $0.042 per million; output tokens are free.
const PRICE_PER_INPUT_TOKEN = 0.042 / 1_000_000;

let client: TypeSafeClient | undefined;
function getClient() {
  return (client ??= new TypeSafeClient());
}

export type AskInput = {
  request: string;
  previousView?: ViewSpec | null;
  today?: Date;
  /** Reorders each axis's options; used by the eval to detect first-option bias. */
  order?: (keys: string[]) => string[];
};

/** One Choice question per axis, built straight from the grammar. */
export function buildQuestions(request: string, order?: AskInput["order"]) {
  const questions: Record<string, ChoiceQuestion | NoulQuestion> = {
    clear: noul(clarityQuestion.instructions, { ...clarityQuestion.criteria }),
  };
  for (const axis of axisOrder) {
    const def = axisDef(axis, request);
    const keys = Object.keys(def.options);
    const criteria: Record<string, Record<string, string>> = {};
    for (const key of order ? order(keys) : keys) {
      const { label, covers, excludes } = def.options[key];
      criteria[key] = excludes ? { label, covers, excludes } : { label, covers };
    }
    questions[axis] = choice(def.instructions, criteria);
  }
  return questions;
}

function buildState({ request, previousView, today = new Date() }: AskInput) {
  return {
    request,
    today: today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    // Labels, not keys: the model reads meaning, and instructions refer to these by name.
    previous_view: previousView
      ? Object.fromEntries(specAxes.map((axis) => [axis, optionLabel(axis, previousView[axis])]))
      : null,
  };
}

/** Ask Jev every question in one request. Answers are independent and run in parallel. */
export async function decide(input: AskInput): Promise<Decision> {
  const started = performance.now();
  const result = await getClient().systemOne({
    state: buildState(input),
    questions: buildQuestions(input.request, input.order),
  });
  const latencyMs = Math.round(performance.now() - started);

  const answers = {} as Record<Axis, AxisAnswer>;
  for (const axis of axisOrder) {
    const a = result.answers[axis];
    if (a.type !== "choice") throw new Error(`Expected a choice answer for ${axis}`);
    answers[axis] = { choice: a.choice, confidence: a.confidence, probabilities: { ...a.probabilities } };
  }
  const clear = result.answers.clear;
  const clarity = clear.type === "noul" ? clear.noul : 1;
  const inputTokens = result.usage.input_tokens ?? 0;
  return { answers, clarity, latencyMs, inputTokens, costUsd: inputTokens * PRICE_PER_INPUT_TOKEN, model: result.model };
}
