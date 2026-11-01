"use client";

import { useId, useState } from "react";
import type { Point } from "@/lib/data/query";
import { seriesColor } from "./shared";

const W = 400;
const H = 140;
const PAD = { top: 12, bottom: 22, x: 4 };

export function Trend({ points, format, color = 0 }: { points: Point[]; format: (n: number) => string; color?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const gradient = useId();
  const hasPrev = points.some((p) => p.prev !== undefined);
  const max = Math.max(1, ...points.map((p) => Math.max(p.value, p.prev ?? 0)));
  const x = (i: number) => PAD.x + (points.length < 2 ? (W - 2 * PAD.x) / 2 : (i / (points.length - 1)) * (W - 2 * PAD.x));
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
  const line = (get: (p: Point) => number | undefined) =>
    points
      .map((p, i) => [i, get(p)] as const)
      .filter(([, v]) => v !== undefined)
      .map(([i, v], n) => `${n ? "L" : "M"}${x(i).toFixed(1)},${y(v!).toFixed(1)}`)
      .join(" ");
  const current = line((p) => p.value);
  const area = `${current} L${x(points.length - 1)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z`;
  const labelIdx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const stroke = seriesColor(color);
  const a = active === null ? null : points[active];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-baseline justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {a ? (
            <>
              <span className="font-medium text-foreground">{a.label}</span> · {format(a.value)}
              {a.prev !== undefined && <> · before {format(a.prev)}</>}
            </>
          ) : (
            <>Peak {format(Math.max(...points.map((p) => p.value)))}</>
          )}
        </span>
        {hasPrev && (
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded" style={{ background: stroke }} /> Now
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-3 border-t border-dashed border-muted-foreground" /> Before
            </span>
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-36 w-full overflow-visible"
        onMouseLeave={() => setActive(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - box.left) / box.width) * W;
          setActive(Math.max(0, Math.min(points.length - 1, Math.round(((rel - PAD.x) / (W - 2 * PAD.x)) * (points.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
          {/* Themes can switch the area to halftone dots and the line to the Jev spectrum. */}
          <pattern id={`${gradient}-dots`} width={4} height={4} patternUnits="userSpaceOnUse">
            <circle cx={2} cy={2} r={0.9} fill={stroke} opacity={0.55} />
          </pattern>
          <linearGradient id="jev-spectrum" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f554c4" />
            <stop offset="45%" stopColor="#9e5ae8" />
            <stop offset="100%" stopColor="#6badcd" />
          </linearGradient>
        </defs>
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} strokeDasharray="2 4" className="stroke-border" />
        ))}
        <line x1={0} x2={W} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-border" />
        <path data-slot="trend-area" d={area} fill={`url(#${gradient})`} />
        <path data-slot="trend-area-dots" d={area} fill={`url(#${gradient}-dots)`} />
        {hasPrev && (
          <path d={line((p) => p.prev)} fill="none" strokeDasharray="3 4" strokeWidth={1.5} className="stroke-muted-foreground/60" />
        )}
        <path data-slot="trend-line" d={current} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <>
            <line x1={x(active)} x2={x(active)} y1={PAD.top - 4} y2={H - PAD.bottom} className="stroke-foreground/15" />
            <circle cx={x(active)} cy={y(points[active].value)} r={4} fill="var(--card)" stroke={stroke} strokeWidth={2} />
          </>
        )}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            data-slot="axis"
            className="fill-faint text-3xs"
          >
            {points[i]?.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
