"use client";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/api";
import { fetchDelayQueue, type DelayQueueItem } from "@/lib/aiApi";
import { getAccessToken } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopilotModule } from "@/components/ai/CopilotModule";
import { ForecastModule } from "@/components/ai/ForecastModule";
import { RouteModule } from "@/components/ai/RouteModule";

interface FraudQueueItem {
  booking_ref: string;
  fraud_probability: number;
  risk_level: string;
  declared_value_inr: number;
  account_age_days: number;
  top_reason: string | null;
}

interface FraudQueue {
  items: FraudQueueItem[];
  scored: number;
  source: string;
}

async function fetchFraudQueue(): Promise<FraudQueue> {
  const res = await fetch(`${API_URL}/api/v1/ai/insights/fraud-queue`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load fraud queue");
  return res.json();
}

const RISK_TONE: Record<string, string> = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-success",
};

function RiskCell({ probability, level }: { probability: number; level: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 rounded-full bg-white/5">
        <span
          className="block h-1.5 rounded-full"
          style={{
            width: `${probability * 100}%`,
            background:
              level === "high"
                ? "var(--color-danger)"
                : level === "medium"
                  ? "var(--color-warning)"
                  : "var(--color-success)",
          }}
        />
      </span>
      <span className={`text-xs font-medium tabular-nums ${RISK_TONE[level] ?? ""}`}>
        {Math.round(probability * 100)}%
      </span>
    </span>
  );
}

export default function InsightsPage() {
  const delayQ = useQuery({
    queryKey: ["delay-queue"],
    queryFn: () => fetchDelayQueue(getAccessToken() ?? ""),
  });
  const fraudQ = useQuery({ queryKey: ["fraud-queue"], queryFn: fetchFraudQueue });

  return (
    <>
      <p className="eyebrow">Operations</p>
      <h1 className="mt-1 font-display text-2xl font-semibold">AI Insights</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        Model-scored risk queues and forecasts. Every item here is an estimate that needs a human
        decision — nothing is actioned automatically.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Delay risk queue */}
        <GlassCard className="p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow">Delay risk — active shipments</p>
            <span className="text-xs text-ink-3">delay model AUC 0.86</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-3">
                  <th className="py-2 pr-3 font-medium">Shipment</th>
                  <th className="py-2 pr-3 font-medium">Lane</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 font-medium">Top factor</th>
                </tr>
              </thead>
              <tbody>
                {(delayQ.data ?? []).map((item: DelayQueueItem) => (
                  <tr key={item.tracking_id} className="border-b border-line/50 last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{item.tracking_id}</td>
                    <td className="py-2.5 pr-3 text-ink-2">{item.lane}</td>
                    <td className="py-2.5 pr-3">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <RiskCell probability={item.delay_probability} level={item.risk_level} />
                    </td>
                    <td className="py-2.5 text-xs text-ink-2">{item.top_factor ?? "—"}</td>
                  </tr>
                ))}
                {delayQ.isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-ink-3">
                      Scoring active shipments…
                    </td>
                  </tr>
                )}
                {delayQ.isError && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-danger">
                      Couldn&apos;t load the delay queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Fraud review queue */}
        <GlassCard className="p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow">Fraud flags — awaiting review</p>
            <span className="text-xs text-ink-3">
              fraud model AUC 0.92 · {fraudQ.data?.source ?? ""}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-ink-3">
                  <th className="py-2 pr-3 font-medium">Booking</th>
                  <th className="py-2 pr-3 font-medium">Value</th>
                  <th className="py-2 pr-3 font-medium">Account age</th>
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 font-medium">Top signal</th>
                </tr>
              </thead>
              <tbody>
                {(fraudQ.data?.items ?? []).map((item) => (
                  <tr key={item.booking_ref} className="border-b border-line/50 last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{item.booking_ref}</td>
                    <td className="py-2.5 pr-3 text-ink-2">
                      ₹{Math.round(item.declared_value_inr).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-2">{item.account_age_days}d</td>
                    <td className="py-2.5 pr-3">
                      <RiskCell probability={item.fraud_probability} level={item.risk_level} />
                    </td>
                    <td className="py-2.5 text-xs text-ink-2">{item.top_reason ?? "—"}</td>
                  </tr>
                ))}
                {fraudQ.isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-ink-3">
                      Scoring recent bookings…
                    </td>
                  </tr>
                )}
                {fraudQ.isError && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-danger">
                      Couldn&apos;t load the fraud queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* forecast + route planning + copilot, reusing the playground modules */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ForecastModule />
        <RouteModule />
        <CopilotModule />
      </div>
    </>
  );
}
