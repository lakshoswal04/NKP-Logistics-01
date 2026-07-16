"use client";

import { cn } from "@/lib/cn";
import type { FactorItem } from "@/lib/aiApi";

/* Chart palette — validated with the dataviz six-checks script against the
   #121216 surface (CVD ΔE 41.3, contrast ≥ 3:1). Fixed slot order, never cycled. */
export const SERIES = ["#4a6fff", "#199e70", "#c98500", "#d55181"] as const;
export const CHART_GRID = "rgba(255,255,255,0.06)";
export const CHART_TICK = "#9a9aa5";

export const inputCls =
  "glass w-full rounded-[10px] px-3.5 py-2.5 text-sm placeholder:text-ink-3 focus:border-accent";
export const labelCls = "mb-1.5 block text-xs font-medium text-ink-2";

export function ModuleShell({
  index,
  title,
  tagline,
  badge,
  children,
  className,
}: {
  index: number;
  title: string;
  tagline: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass flex h-full flex-col rounded-2xl p-7", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-display text-sm font-semibold text-accent">
            {String(index).padStart(2, "0")}
          </span>
          <h3 className="mt-1 font-display text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{tagline}</p>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent-hover">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-5 flex-1">{children}</div>
      <p className="mt-5 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-3">
        AI estimate for decision support — not ground truth. A human confirms every action.
      </p>
    </div>
  );
}

const LEVEL_COLOR: Record<string, string> = {
  low: "var(--color-success)",
  medium: "var(--color-warning)",
  high: "var(--color-danger)",
};

/** Half-circle risk meter. Value 0..1; colored by status level (reserved palette). */
export function RiskGauge({
  value,
  level,
  label,
}: {
  value: number;
  level: "low" | "medium" | "high";
  label: string;
}) {
  const angle = Math.min(Math.max(value, 0), 1) * 180;
  const r = 64;
  const cx = 80;
  const cy = 78;
  const end = {
    x: cx - r * Math.cos((angle * Math.PI) / 180),
    y: cy - r * Math.sin((angle * Math.PI) / 180),
  };
  const color = LEVEL_COLOR[level];
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${Math.round(value * 100)}%, ${level} risk`}>
      <svg width="160" height="92" viewBox="0 0 160 92">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={CHART_GRID}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: "all 600ms ease" }}
        />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="26" fontWeight="600" fill="var(--color-ink)" fontFamily="var(--font-clash)">
          {Math.round(value * 100)}%
        </text>
      </svg>
      <span
        className="rounded-full px-3 py-1 text-xs font-medium lowercase"
        style={{ color, background: "color-mix(in srgb, currentColor 14%, transparent)" }}
      >
        {level} risk — {label}
      </span>
    </div>
  );
}

/** Horizontal impact bars: single hue, thin rounded marks, text in ink tokens. */
export function FactorBars({ factors }: { factors: FactorItem[] }) {
  const max = Math.max(...factors.map((f) => f.impact), 0.01);
  return (
    <ul className="space-y-3">
      {factors.map((f) => (
        <li key={f.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-2">{f.label}</span>
            <span className="text-[11px] tabular-nums text-ink-3">
              {f.impact > 0 ? `+${f.impact.toFixed(2)}` : "—"}
            </span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-white/5">
            <div
              className="h-1 rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(f.impact / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ResultSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-white/5" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
