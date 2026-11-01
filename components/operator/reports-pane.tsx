"use client";

import { LayoutGrid } from "lucide-react";
import { summaryFor, titleFor } from "@/lib/copy";
import { query } from "@/lib/data/query";
import type { Dataset } from "@/lib/data/seed";
import type { ViewSpec } from "@/lib/grammar";
import { ViewCard } from "./view-card";

export type Report = { id: string; spec: ViewSpec };

/** Saved views. Each stores only its spec and re-queries live data. */
export function ReportsPane({ reports, getDataset, onRemove }: { reports: Report[]; getDataset: () => Dataset; onRemove: (id: string) => void }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 p-6 lg:overflow-y-auto lg:p-8">
      <header className="flex items-baseline gap-2">
        <h1 data-slot="page-title" className="text-lg font-medium tracking-tight">
          Reports
        </h1>
        {reports.length > 0 && <span className="text-sm text-muted-foreground tabular-nums">{reports.length}</span>}
      </header>
      {reports.length === 0 ? (
        <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <LayoutGrid className="size-5 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">No saved views yet</p>
            <p className="max-w-64 text-sm text-muted-foreground">Ask Operator a question, then save the view it builds. It stays live here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {reports.map((r) => {
            const data = query(r.spec, getDataset());
            return <ViewCard key={r.id} spec={r.spec} data={data} title={titleFor(r.spec, data)} summary={summaryFor(r.spec, data)} onRemove={() => onRemove(r.id)} />;
          })}
        </div>
      )}
    </section>
  );
}
