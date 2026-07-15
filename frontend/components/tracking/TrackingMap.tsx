"use client";

import { useMemo } from "react";
import type { TrackingResult } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";

/**
 * Stylized route map (mock map provider). Projects the shipment's event
 * coordinates onto an abstract dark panel with a dot grid, drawing the route
 * with waypoint hotspot markers — the §11.3 signature motif applied to
 * tracking. Swaps for the Google Maps JS SDK when
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured (iteration 2).
 */
export function TrackingMap({ result }: { result: TrackingResult }) {
  const pts = useMemo(() => {
    const located = result.events.filter((e) => e.lat != null && e.lng != null);
    if (located.length === 0) return [];
    const lats = located.map((e) => e.lat!);
    const lngs = located.map((e) => e.lng!);
    const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
    const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
    const spanLat = Math.max(maxLat - minLat, 0.01);
    const spanLng = Math.max(maxLng - minLng, 0.01);
    // 12% padding inside a 600x380 viewBox; screen y grows downward
    return located.map((e) => ({
      x: 72 + ((e.lng! - minLng) / spanLng) * 456,
      y: 320 - ((e.lat! - minLat) / spanLat) * 260,
      status: e.status,
      location: e.location,
    }));
  }, [result]);

  if (pts.length === 0) {
    return (
      <GlassCard className="flex min-h-72 items-center justify-center p-8">
        <p className="text-sm text-ink-3">Route map appears once the shipment is picked up.</p>
      </GlassCard>
    );
  }

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const current = pts[pts.length - 1];
  const done = ["delivered", "failed"].includes(result.status);

  return (
    <GlassCard className="relative overflow-hidden p-2">
      <svg viewBox="0 0 600 380" className="h-auto w-full" role="img" aria-label={`Route from ${result.origin_city} to ${result.destination_city}`}>
        <defs>
          <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="#FFFFFF" fillOpacity="0.06" />
          </pattern>
          <linearGradient id="routeline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2E5BFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2E5BFF" />
          </linearGradient>
        </defs>
        <rect width="600" height="380" fill="#0D0D11" />
        <rect width="600" height="380" fill="url(#dotgrid)" />

        {/* planned route */}
        <path d={path} stroke="url(#routeline)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray={done ? undefined : "1 0"} />

        {/* waypoints */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" />
            <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" />
          </g>
        ))}

        {/* current position pulse */}
        {!done && (
          <g>
            <circle cx={current.x} cy={current.y} r="7" fill="#2E5BFF" />
            <circle cx={current.x} cy={current.y} r="7" fill="#2E5BFF" opacity="0.5">
              <animate attributeName="r" values="7;20" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* origin / destination labels */}
        <text x={pts[0].x} y={pts[0].y + 24} textAnchor="middle" fill="#9A9AA5" fontSize="12" fontFamily="var(--font-general)">
          {result.origin_city}
        </text>
        <text x={current.x} y={current.y - 16} textAnchor="middle" fill="#F5F5F7" fontSize="12" fontWeight="600" fontFamily="var(--font-general)">
          {done ? result.destination_city : current.location ?? "En route"}
        </text>
      </svg>
      <p className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-ink-3">
        Schematic route view
      </p>
    </GlassCard>
  );
}
