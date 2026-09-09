"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Disclaimer, ModuleCard, inputCls, labelCls } from "@/components/ai/Primitives";
import { Button } from "@/components/ui/Button";
import { advisePlacement } from "@/lib/aiApi";

const DEFAULT_ROWS = [
  { city: "Mumbai", orders: 4200 },
  { city: "Bengaluru", orders: 3100 },
  { city: "Delhi", orders: 2400 },
  { city: "Kolkata", orders: 600 },
  { city: "Shillong", orders: 150 },
];

export function PlacementTool({ index }: { index: number }) {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const mutation = useMutation({
    mutationFn: (input: typeof DEFAULT_ROWS) => advisePlacement(input),
  });
  const result = mutation.data;
  const total = rows.reduce((sum, row) => sum + (row.orders || 0), 0);

  return (
    <ModuleCard
      index={index}
      title="Fulfilment-centre Placement"
      tagline="Where should your stock physically sit? Paste your monthly order distribution and get a split, with the reasoning your finance team would ask for."
      mode={result?.mode}
      model={result?.model}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(rows.filter((r) => r.city.trim() && r.orders > 0));
        }}
      >
        <p className={labelCls}>Monthly orders by city</p>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label={`City ${i + 1}`}
                value={row.city}
                onChange={(event) =>
                  setRows((prev) =>
                    prev.map((r, j) => (i === j ? { ...r, city: event.target.value } : r)),
                  )
                }
                className={inputCls}
              />
              <input
                aria-label={`Orders for ${row.city || `city ${i + 1}`}`}
                type="number"
                min={0}
                value={row.orders}
                onChange={(event) =>
                  setRows((prev) =>
                    prev.map((r, j) =>
                      i === j ? { ...r, orders: Number(event.target.value) || 0 } : r,
                    ),
                  )
                }
                className={`${inputCls} w-32 shrink-0`}
              />
              <button
                type="button"
                aria-label={`Remove ${row.city || "row"}`}
                onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                className="shrink-0 border border-line-strong px-3 text-ink-3 transition-colors hover:border-danger hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, { city: "", orders: 0 }])}
            className="text-[12.5px] font-semibold text-brand hover:text-brand-hover"
          >
            + Add a city
          </button>
          <span className="text-[12px] text-ink-3">{total.toLocaleString("en-IN")} orders/month</span>
        </div>

        <Button type="submit" className="mt-4" disabled={mutation.isPending || total === 0}>
          {mutation.isPending ? "Modelling…" : "Model the split"}
        </Button>
      </form>

      {result && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-[14px] leading-relaxed text-ink">{result.summary}</p>

          <div className="mt-5 flex flex-col gap-3">
            {result.recommended.map((pick) => (
              <div key={pick.fulfilment_centre}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] font-semibold text-ink">
                    {pick.fulfilment_centre}
                  </span>
                  <span className="font-display text-[15px] font-bold text-ink">
                    {pick.share_pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full bg-mist">
                  <div
                    className="h-full bg-brand transition-all duration-500"
                    style={{ width: `${Math.min(pick.share_pct, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-ink-3">{pick.rationale}</p>
              </div>
            ))}
          </div>

          {result.unmapped_orders > 0 && (
            <p className="mt-5 border-l-2 border-warning bg-warning-soft p-3 text-[12.5px] text-ink-2">
              {result.unmapped_orders.toLocaleString("en-IN")} orders fall outside our mapped city
              list and would ship long-haul from the nearest centre.
            </p>
          )}

          <Disclaimer>{result.reasoning}</Disclaimer>
        </div>
      )}
    </ModuleCard>
  );
}
