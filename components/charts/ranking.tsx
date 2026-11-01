"use client";

import { useState } from "react";
import type { Item } from "@/lib/data/query";
import { cn } from "@/lib/utils";
import { Delta, seriesColor } from "./shared";

export function Ranking({ items, format }: { items: Item[]; format: (n: number) => string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul data-chart="ranking" className="-mx-2 flex flex-col" onMouseLeave={() => setHovered(null)}>
      {items.map((item) => (
        <li
          key={item.key}
          onMouseEnter={() => setHovered(item.key)}
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
            hovered === item.key && "bg-muted",
          )}
        >
          <span className="w-28 shrink-0 truncate">{item.label}</span>
          <span data-slot="track" className="flex h-2 flex-1 items-center bg-track">
            <span
              data-slot="mark"
              className={cn(
                "h-full rounded-bar transition-[width,opacity] duration-500",
                hovered && hovered !== item.key && "opacity-30",
              )}
              style={{ width: `${Math.max(1, (item.value / max) * 100)}%`, backgroundColor: seriesColor(item.color), ["--fill" as string]: Math.max(0.01, item.value / max) }}
            />
          </span>
          <Delta value={item.value} prev={item.prev} />
          <span className="w-16 text-right font-medium tabular-nums">{format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}
