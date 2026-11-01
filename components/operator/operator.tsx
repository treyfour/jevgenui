"use client";

import { SquarePen } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { generateDataset, type Dataset } from "@/lib/data/seed";
import type { Axis, ViewSpec } from "@/lib/grammar";
import { deriveView, type Turn as TurnState } from "@/lib/turn";
import { Composer } from "./composer";
import { JevMark } from "./jev-mark";
import { ReportsPane, type Report } from "./reports-pane";
import { ThemePicker } from "./theme-picker";
import { Chip, Turn } from "./turn";

const suggestions = [
  "Where did leads come from this week?",
  "How did revenue trend this month?",
  "Which reps closed the most deals this quarter?",
];

// Built on first use, in the browser only: it depends on the current time, so it must not
// run during prerendering. Nothing reads it until the user asks a question.
let cachedDataset: Dataset | undefined;
const getDataset = () => (cachedDataset ??= generateDataset());

export function Operator() {
  const [turns, setTurns] = useState<TurnState[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const update = (id: string, patch: Partial<TurnState>) => setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const specOf = (turn: TurnState): ViewSpec | null => (turn.decision ? deriveView(turn.decision, turn.overrides, getDataset()).spec : null);

  const run = (id: string, text: string, previousView: ViewSpec | null) => {
    startTransition(async () => {
      const result = await ask(text, previousView);
      if (result.ok) update(id, { status: "done", decision: result.decision, error: undefined });
      else update(id, { status: "error", error: result.error });
    });
  };

  const submit = (text: string) => {
    if (isPending) return;
    const last = [...turns].reverse().find((t) => t.status === "done");
    const id = crypto.randomUUID();
    setTurns((ts) => [...ts, { id, text, status: "pending", overrides: {} }]);
    run(id, text, last ? specOf(last) : null);
  };

  const override = (id: string, axis: Axis, value: string) =>
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, overrides: { ...t.overrides, [axis]: value } } : t)));

  const retry = (turn: TurnState) => {
    if (isPending) return;
    const index = turns.findIndex((t) => t.id === turn.id);
    const previous = turns.slice(0, index).reverse().find((t) => t.status === "done");
    update(turn.id, { status: "pending", error: undefined });
    run(turn.id, turn.text, previous ? specOf(previous) : null);
  };

  const save = (turn: TurnState) => {
    const spec = specOf(turn);
    if (spec) setReports((rs) => [{ id: crypto.randomUUID(), spec }, ...rs]);
  };

  // Follow the conversation: a new turn, its answer arriving, or a change to the latest view.
  const lastStatus = turns.at(-1)?.status;
  const lastOverrides = turns.at(-1)?.overrides;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length, lastStatus, lastOverrides]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas-art lg:h-dvh lg:flex-row">
      <ReportsPane reports={reports} getDataset={getDataset} onRemove={(id) => setReports((rs) => rs.filter((r) => r.id !== id))} />

      <aside className="order-first flex h-[88dvh] min-h-0 flex-none flex-col p-3 lg:order-none lg:h-auto lg:w-[460px] lg:py-4 lg:pr-4 lg:pl-0">
        <div data-slot="panel" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <header data-slot="window-bar" className="flex items-center justify-between border-b bg-window-bar px-4 py-3 text-window-bar-foreground">
            <div className="flex items-center gap-2.5">
              <JevMark className="size-5" />
              <span data-slot="window-title" className="font-medium">
                Operator
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <ThemePicker />
              <Button variant="ghost" size="icon-sm" onClick={() => setTurns([])} disabled={!turns.length || isPending} aria-label="New conversation">
                <SquarePen />
              </Button>
            </div>
          </header>

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
            {turns.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Ask anything about your pipeline. Jev picks the view.</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((q) => (
                    <Chip key={q} onClick={() => submit(q)}>
                      {q}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((turn, i) => (
                <Turn
                  key={turn.id}
                  turn={turn}
                  dataset={getDataset()}
                  isLatest={i === turns.length - 1}
                  onOverride={(axis, value) => override(turn.id, axis, value)}
                  onAsk={submit}
                  onRetry={() => retry(turn)}
                  onSave={() => save(turn)}
                />
              ))
            )}
          </div>

          <div className="p-3 pt-0">
            <Composer onSubmit={submit} disabled={isPending} />
          </div>
        </div>
      </aside>
    </div>
  );
}
