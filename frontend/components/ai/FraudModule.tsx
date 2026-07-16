"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { fetchFraudRisk, type FraudInput } from "@/lib/aiApi";
import { FactorBars, ModuleShell, ResultSkeleton, RiskGauge, inputCls, labelCls } from "@/components/ai/Primitives";
import { cn } from "@/lib/cn";

const TOGGLES: { key: keyof FraudInput; label: string }[] = [
  { key: "payment_cod", label: "Cash on delivery" },
  { key: "address_mismatch", label: "Address mismatch" },
  { key: "night_booking", label: "Booked at night" },
  { key: "new_lane_for_customer", label: "First time on lane" },
];

export function FraudModule({ badge }: { badge?: string }) {
  const [signals, setSignals] = useState<FraudInput>({
    account_age_days: 400,
    bookings_last_24h: 1,
    declared_value_inr: 80000,
    weight_kg: 500,
    payment_cod: false,
    address_mismatch: false,
    night_booking: false,
    claims_ratio: 0.02,
    new_lane_for_customer: false,
  });
  const m = useMutation({ mutationFn: () => fetchFraudRisk(signals) });
  const r = m.data;

  return (
    <ModuleShell
      index={4}
      title="AI Fraud Detection"
      tagline="Suspicious bookings caught earlier than any manual review."
      badge={badge}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fraud-age" className={labelCls}>
            Account age (days)
          </label>
          <input
            id="fraud-age"
            type="number"
            min={0}
            className={inputCls}
            value={signals.account_age_days}
            onChange={(e) => setSignals({ ...signals, account_age_days: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label htmlFor="fraud-velocity" className={labelCls}>
            Bookings last 24h
          </label>
          <input
            id="fraud-velocity"
            type="number"
            min={0}
            max={50}
            className={inputCls}
            value={signals.bookings_last_24h}
            onChange={(e) => setSignals({ ...signals, bookings_last_24h: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label htmlFor="fraud-value" className={labelCls}>
            Declared value (₹)
          </label>
          <input
            id="fraud-value"
            type="number"
            min={1000}
            step={10000}
            className={inputCls}
            value={signals.declared_value_inr}
            onChange={(e) => setSignals({ ...signals, declared_value_inr: Number(e.target.value) || 1000 })}
          />
        </div>
        <div>
          <label htmlFor="fraud-weight" className={labelCls}>
            Weight (kg)
          </label>
          <input
            id="fraud-weight"
            type="number"
            min={1}
            className={inputCls}
            value={signals.weight_kg}
            onChange={(e) => setSignals({ ...signals, weight_kg: Number(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TOGGLES.map((t) => {
          const on = Boolean(signals[t.key]);
          return (
            <button
              key={t.key}
              role="switch"
              aria-checked={on}
              onClick={() => setSignals({ ...signals, [t.key]: !on })}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                on ? "bg-accent text-white" : "glass text-ink-2 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-4 w-full rounded-[10px] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {m.isPending ? "Scoring…" : "Score booking"}
      </button>

      <div className="mt-5 min-h-28">
        {m.isPending && <ResultSkeleton />}
        {m.isError && <p className="text-sm text-danger">Scoring failed — try again.</p>}
        {r && (
          <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
            <RiskGauge value={r.fraud_probability} level={r.risk_level} label="fraud" />
            <FactorBars factors={r.reasons} />
          </div>
        )}
        {!r && !m.isPending && !m.isError && (
          <p className="text-sm text-ink-3">
            Flip on a few signals — a 4-day-old account booking high-value COD at night tells a story.
          </p>
        )}
      </div>
    </ModuleShell>
  );
}
