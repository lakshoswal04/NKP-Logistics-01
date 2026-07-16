"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchForecast, fetchForecastLanes } from "@/lib/aiApi";
import { CHART_GRID, CHART_TICK, ModuleShell, ResultSkeleton, SERIES, inputCls, labelCls } from "@/components/ai/Primitives";

interface Row {
  date: string;
  history?: number;
  forecast?: number;
  band?: [number, number];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number | [number, number]; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.dataKey !== "band");
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-ink-3">{label}</p>
      {rows.map((p) => (
        <p key={p.dataKey} className="mt-0.5 font-medium text-ink">
          {p.dataKey === "history" ? "Actual" : "Forecast"}: {Math.round(Number(p.value))} shipments
        </p>
      ))}
    </div>
  );
}

export function ForecastModule({ badge }: { badge?: string }) {
  const lanes = useQuery({ queryKey: ["forecast-lanes"], queryFn: fetchForecastLanes });
  const [lane, setLane] = useState<string>("Mumbai → Delhi");
  const q = useQuery({
    queryKey: ["forecast", lane],
    queryFn: () => fetchForecast(lane),
  });

  const rows: Row[] = [];
  if (q.data) {
    for (const p of q.data.history.slice(-45)) rows.push({ date: p.date, history: p.volume });
    // bridge point so the lines connect
    const lastHist = q.data.history.at(-1);
    if (lastHist) rows.push({ date: lastHist.date, forecast: lastHist.volume });
    for (const p of q.data.forecast)
      rows.push({ date: p.date, forecast: p.volume, band: [p.low ?? p.volume, p.high ?? p.volume] });
  }

  return (
    <ModuleShell
      index={5}
      title="AI Demand Forecasting"
      tagline="Capacity positioned where next month's volume will actually be."
      badge={badge}
      className="lg:col-span-2"
    >
      <div className="max-w-xs">
        <label htmlFor="forecast-lane" className={labelCls}>
          Lane
        </label>
        <select id="forecast-lane" className={inputCls} value={lane} onChange={(e) => setLane(e.target.value)}>
          {(lanes.data?.lanes ?? [lane]).map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 h-64">
        {q.isLoading && <ResultSkeleton lines={5} />}
        {q.data && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
                stroke={CHART_GRID}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_TICK, strokeDasharray: "3 3" }} />
              <Area dataKey="band" fill={SERIES[0]} fillOpacity={0.14} stroke="none" isAnimationActive={false} />
              <Line
                dataKey="history"
                stroke={SERIES[0]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="forecast"
                stroke={SERIES[0]}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      {q.data && (
        <div className="mt-2 flex items-center gap-5 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-5 rounded" style={{ background: SERIES[0] }} />
            Actual (90 days)
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="2" aria-hidden>
              <line x1="0" y1="1" x2="20" y2="1" stroke={SERIES[0]} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            Forecast (28 days, shaded = confidence)
          </span>
        </div>
      )}
    </ModuleShell>
  );
}
