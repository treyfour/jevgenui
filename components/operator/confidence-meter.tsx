import type { Tier } from "@/lib/policy";
import { cn } from "@/lib/utils";

const filled: Record<Tier, number> = { high: 3, medium: 2, low: 1 };

/** Three bars: the tier that drives behavior (render silently, offer alternatives, ask). */
export function ConfidenceMeter({ tier, muted }: { tier: Tier; muted?: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-label={`${tier} confidence`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-bar",
            i < filled[tier] ? (muted ? "bg-muted-foreground/40" : "bg-signal") : "bg-border",
          )}
          style={{ height: `${50 + i * 25}%` }}
        />
      ))}
    </span>
  );
}
