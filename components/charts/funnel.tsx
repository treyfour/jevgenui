"use client";

import { useState } from "react";
import type { Step } from "@/lib/data/query";
import { cn } from "@/lib/utils";
import { seriesColor } from "./shared";

export function Funnel({ steps }: { steps: Step[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const first = Math.max(1, steps[0]?.value ?? 1);

  return (
    <ol data-chart="funnel" className="-mx-2 flex flex-col" onMouseLeave={() => setHovered(null)}>
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const kept = prev ? Math.round((step.value / prev) * 100) : null;
        return (
          <li
            key={step.key}
            onMouseEnter={() => setHovered(step.key)}
            className={cn("flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors", hovered === step.key && "bg-muted")}
          >
            <span className="w-24 shrink-0 truncate">{step.label}</span>
            <span data-slot="track" className="flex h-6 flex-1 items-center bg-track">
              <span
                data-slot="mark"
                className={cn("h-full rounded-bar transition-[width,opacity] duration-500", hovered && hovered !== step.key && "opacity-40")}
                style={{
                  width: `${Math.max(1, (step.value / first) * 100)}%`,
                  // Fade by mixing toward the card color, so hover can still use opacity.
                  backgroundColor: `color-mix(in oklch, ${seriesColor(0)} ${100 - i * 14}%, var(--card))`,
                  ["--fill" as string]: Math.max(0.01, step.value / first),
                }}
              />
            </span>
            <span className="w-12 text-right font-medium tabular-nums">{step.value.toLocaleString("en-US")}</span>
            <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">{kept === null ? "" : `${kept}%`}</span>
          </li>
        );
      })}
    </ol>
  );
}
