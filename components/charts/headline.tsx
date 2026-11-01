import { Delta } from "./shared";

export function Headline({ total, prevTotal, caption, format }: { total: number; prevTotal?: number; caption: string; format: (n: number) => string }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span data-slot="display" className="font-display text-5xl font-medium tracking-tight tabular-nums">{format(total)}</span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {caption}
        {prevTotal !== undefined && (
          <>
            <Delta value={total} prev={prevTotal} className="text-sm font-medium" />
            <span>vs {format(prevTotal)} before</span>
          </>
        )}
      </span>
    </div>
  );
}
