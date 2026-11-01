"use client";

import { Bell, Check, Copy, MoreHorizontal, Plus, Search, Share2, X } from "lucide-react";
import { useState } from "react";
import { Breakdown } from "@/components/charts/breakdown";
import { Funnel } from "@/components/charts/funnel";
import { Headline } from "@/components/charts/headline";
import { Ranking } from "@/components/charts/ranking";
import { Trend } from "@/components/charts/trend";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatValue } from "@/lib/copy";
import { colorIndexOf } from "@/lib/data/catalog";
import type { ViewData } from "@/lib/data/query";
import { optionLabel, type ViewSpec } from "@/lib/grammar";
import { cn } from "@/lib/utils";

const actions = {
  save: { hint: "Save to reports", button: "Save", done: "Saved", icon: Plus },
  share: { hint: "Share with your team", button: "Share", done: "Copied", icon: Share2 },
  setAlert: { hint: "Get notified when this changes", button: "Set alert", done: "Alert set", icon: Bell },
  drillDown: { hint: "Explore what\u2019s behind this", button: "Drill down", done: "Asked", icon: Search },
} as const;

export type NextStep = keyof typeof actions;

type Props = {
  spec: ViewSpec;
  data: ViewData;
  title: string;
  summary: string;
  nextStep?: NextStep;
  onAction?: (step: NextStep) => void;
  onRemove?: () => void;
  className?: string;
};

export function ViewCard({ spec, data, title, summary, nextStep, onAction, onRemove, className }: Props) {
  const [done, setDone] = useState<NextStep | null>(null);
  const format = (n: number) => formatValue(spec.metric, n);
  const run = (step: NextStep) => {
    if (step === "share") void navigator.clipboard?.writeText(`${title}\n${summary}`);
    onAction?.(step);
    setDone(step);
  };
  const action = nextStep ? actions[nextStep] : null;
  const ActionIcon = action?.icon;

  return (
    <section className={cn("animate-card-enter overflow-hidden rounded-xl border bg-card", className)}>
      <header data-slot="window-bar" className="flex items-center justify-between gap-2 border-b bg-window-bar px-4 py-2.5 text-window-bar-foreground">
        <h3 data-slot="window-title" className="truncate text-sm font-medium">
          {title}
        </h3>
        {onRemove ? (
          <Button variant="ghost" size="icon-xs" onClick={onRemove} aria-label="Remove from reports">
            <X />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => run("share")}>
                <Copy /> Copy summary
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => run("save")}>
                <Plus /> Save to reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      <div data-slot="plot" className="bg-plot-art px-4 py-4">
        {renderChart(spec, data, format)}
      </div>
      {action && ActionIcon && nextStep && (
        <footer className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{action.hint}</span>
          <Button size="sm" variant={done === nextStep ? "secondary" : "outline"} onClick={() => run(nextStep)} disabled={done === nextStep}>
            {done === nextStep ? <Check /> : <ActionIcon />}
            {done === nextStep ? action.done : action.button}
          </Button>
        </footer>
      )}
    </section>
  );
}

function renderChart(spec: ViewSpec, data: ViewData, format: (n: number) => string) {
  switch (data.kind) {
    case "breakdown":
      return <Breakdown items={data.items} total={data.total} format={format} />;
    case "ranking":
      return <Ranking items={data.items} format={format} />;
    case "trend": {
      const [dim, key] = spec.focus.split(":");
      const color = dim === "channel" ? colorIndexOf("channel", key) : 0;
      return <Trend points={data.points} format={format} color={color} />;
    }
    case "funnel":
      return <Funnel steps={data.steps} />;
    case "headline":
      return <Headline total={data.total} prevTotal={data.prevTotal} format={format} caption={optionLabel("range", spec.range)} />;
  }
}
