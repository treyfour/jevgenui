import { cn } from "@/lib/utils";

export const seriesColor = (index: number) => `var(--chart-${(index % 6) + 1})`;

export function Delta({ value, prev, className }: { value: number; prev?: number; className?: string }) {
  if (prev === undefined) return null;
  const pct = prev === 0 ? (value === 0 ? 0 : 100) : Math.round(((value - prev) / prev) * 100);
  return (
    <span
      className={cn(
        "tabular-nums text-xs",
        pct > 0 ? "text-positive" : pct < 0 ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {/* The glyph carries direction, so meaning never depends on color alone. */}
      {pct > 0 ? "▲" : pct < 0 ? "▼" : "–"} {Math.abs(pct)}%
    </span>
  );
}
