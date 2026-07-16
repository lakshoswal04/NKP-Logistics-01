"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fetchDelayRisk } from "@/lib/aiApi";
import { LaneControls, type LaneState } from "@/components/ai/LaneControls";
import { FactorBars, ModuleShell, ResultSkeleton, RiskGauge } from "@/components/ai/Primitives";

export function DelayModule({ badge }: { badge?: string }) {
  const [lane, setLane] = useState<LaneState>({
    origin_city: "Kolkata",
    destination_city: "Guwahati",
    shipment_type: "ltl",
    weight_kg: 800,
  });
  const m = useMutation({ mutationFn: () => fetchDelayRisk(lane) });
  const r = m.data;

  return (
    <ModuleShell
      index={3}
      title="AI Delay Prediction"
      tagline="Fewer late deliveries because risk is flagged before the truck leaves."
      badge={badge}
    >
      <LaneControls value={lane} onChange={setLane} idPrefix="delay" />
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-4 w-full rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {m.isPending ? "Scoring…" : "Score delay risk"}
      </button>

      <div className="mt-5 min-h-28">
        {m.isPending && <ResultSkeleton />}
        {m.isError && <p className="text-sm text-danger">Couldn&apos;t score this lane. Try another pair.</p>}
        {r && (
          <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
            <RiskGauge value={r.delay_probability} level={r.risk_level} label="delay" />
            <FactorBars factors={r.factors} />
          </div>
        )}
        {!r && !m.isPending && !m.isError && (
          <p className="text-sm text-ink-3">
            Try Kolkata → Guwahati in July — monsoon on a sensitive corridor.
          </p>
        )}
      </div>
    </ModuleShell>
  );
}
