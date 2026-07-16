"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { CHART_GRID, CHART_TICK, SERIES } from "@/components/ai/Primitives";

interface Overview {
  shipments_total: number;
  shipments_by_status: Record<string, number>;
  active: number;
  leads_last_30d: number;
  quotes_count: number;
  quotes_value_max: number;
}

async function fetchOverview(): Promise<Overview> {
  const res = await fetch(`${API_URL}/api/v1/ai/insights/overview`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load overview");
  return res.json();
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <GlassCard className="p-6">
      <p className="font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-ink-2">{label}</p>
    </GlassCard>
  );
}

export default function AdminOverviewPage() {
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: fetchOverview });
  const d = q.data;

  const statusData = d
    ? Object.entries(d.shipments_by_status).map(([k, v]) => ({
        label: k.replaceAll("_", " "),
        value: v,
      }))
    : [];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Overview</h1>
        </div>
        <Link href="/admin/insights" className="text-sm font-medium text-accent hover:text-accent-hover">
          AI Insights →
        </Link>
      </div>

      {q.isError && (
        <p className="mt-8 text-sm text-danger">Couldn&apos;t load overview — is the API running?</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile value={d ? String(d.shipments_total) : "—"} label="Total shipments" />
        <Tile value={d ? String(d.active) : "—"} label="Active right now" />
        <Tile value={d ? String(d.leads_last_30d) : "—"} label="Leads (30 days)" />
        <Tile
          value={d ? `₹${Math.round(d.quotes_value_max).toLocaleString("en-IN")}` : "—"}
          label={`Quoted value (${d?.quotes_count ?? 0} quotes)`}
        />
      </div>

      <GlassCard className="mt-6 p-6">
        <p className="eyebrow mb-4">Shipments by status</p>
        <div className="h-64">
          {d && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} />
                <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "rgba(18,18,22,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#f5f5f7",
                  }}
                />
                <Bar dataKey="value" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </>
  );
}
