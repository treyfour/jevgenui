"use client";

import { useState } from "react";
import type { Item } from "@/lib/data/query";
import { cn } from "@/lib/utils";
import { Delta, seriesColor } from "./shared";

export function Breakdown({ items, total, format }: { items: Item[]; total: number; format: (n: number) => string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const visible = items.filter((i) => i.value > 0);

  return (
    <div data-chart="breakdown" className="flex flex-col gap-4">
      <div className="flex h-2.5 gap-0.5" onMouseLeave={() => setHovered(null)}>
        {visible.map((item) => (
          <div
            key={item.key}
            data-slot="mark"
            onMouseEnter={() => setHovered(item.key)}
            className={cn(
              "h-full rounded-bar transition-opacity duration-200",
              hovered && hovered !== item.key && "opacity-25",
            )}
            style={{ flexGrow: item.value, flexBasis: 0, minWidth: 4, backgroundColor: seriesColor(item.color) }}
          />
        ))}
      </div>
      <ul className="-mx-2 flex flex-col" onMouseLeave={() => setHovered(null)}>
        {items.map((item) => (
          <li
            key={item.key}
            onMouseEnter={() => setHovered(item.key)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              hovered === item.key && "bg-muted",
            )}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(item.color) }} />
            <span className="flex-1 truncate">{item.label}</span>
            <Delta value={item.value} prev={item.prev} />
            <span className="w-16 text-right font-medium tabular-nums">{format(item.value)}</span>
            <span className="w-14 text-right text-muted-foreground tabular-nums">
              {total ? `${((item.value / total) * 100).toFixed(1)}%` : "–"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
