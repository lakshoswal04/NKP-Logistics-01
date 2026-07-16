"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fetchEta } from "@/lib/aiApi";
import { LaneControls, type LaneState } from "@/components/ai/LaneControls";
import { ModuleShell, ResultSkeleton } from "@/components/ai/Primitives";

function fmt(hours: number): string {
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)} days`;
}

export function EtaModule({ badge }: { badge?: string }) {
  const [lane, setLane] = useState<LaneState>({
    origin_city: "Mumbai",
    destination_city: "Delhi",
    shipment_type: "ftl",
    weight_kg: 1200,
  });
  const m = useMutation({ mutationFn: () => fetchEta(lane) });
  const r = m.data;

  // window position for the range visual
  const span = r ? r.window_high_hours * 1.08 : 1;

  return (
    <ModuleShell
      index={2}
      title="AI ETA Prediction"
      tagline="Delivery windows your customers can plan around."
      badge={badge}
    >
      <LaneControls value={lane} onChange={setLane} idPrefix="eta" />
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-4 w-full rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {m.isPending ? "Predicting…" : "Predict delivery window"}
      </button>

      <div className="mt-5 min-h-28">
        {m.isPending && <ResultSkeleton />}
        {m.isError && <p className="text-sm text-danger">Couldn&apos;t score this lane. Try another pair.</p>}
        {r && (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold">{fmt(r.predicted_hours)}</span>
              <span className="text-sm text-ink-2">
                expected · {Math.round(r.distance_km).toLocaleString("en-IN")} km lane
              </span>
            </div>
            {/* confidence window */}
            <div className="mt-4">
              <div className="relative h-2 rounded-full bg-white/5">
                <div
                  className="absolute h-2 rounded-full bg-accent/30"
                  style={{
                    left: `${(r.window_low_hours / span) * 100}%`,
                    width: `${((r.window_high_hours - r.window_low_hours) / span) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_rgb(46_91_255/0.9)]"
                  style={{ left: `${(r.predicted_hours / span) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
                <span>earliest {fmt(r.window_low_hours)}</span>
                <span>latest {fmt(r.window_high_hours)}</span>
              </div>
            </div>
          </div>
        )}
        {!r && !m.isPending && !m.isError && (
          <p className="text-sm text-ink-3">Pick a lane and predict — the model was trained on 40,000 journeys.</p>
        )}
      </div>
    </ModuleShell>
  );
}
