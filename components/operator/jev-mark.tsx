import { cn } from "@/lib/utils";

// A 3×3 grid of choices with one picked: selection, not generation.
const cells = [0.25, 0.45, 0.25, 0.45, 1, 0.45, 0.25, 0.45, 0.25];

export function JevMark({ className }: { className?: string }) {
  return (
    <svg data-slot="jev-mark" viewBox="0 0 12 12" className={cn("shrink-0 text-signal", className)} aria-hidden>
      {cells.map((opacity, i) => (
        <rect key={i} x={(i % 3) * 4 + 0.5} y={Math.floor(i / 3) * 4 + 0.5} width={3} height={3} rx={0.8} fill="currentColor" opacity={opacity} />
      ))}
    </svg>
  );
}
