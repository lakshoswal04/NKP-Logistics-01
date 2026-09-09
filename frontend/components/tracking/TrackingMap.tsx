"use client";

import type { TrackingResult } from "@/lib/api";

/**
 * Schematic route view.
 *
 * Deliberately not a real basemap: points are linearly fitted into the viewBox,
 * which conveys sequence and progress without pretending to geographic accuracy.
 * A real map goes in when there is a maps key and live vehicle telemetry to plot.
 */
export function TrackingMap({ result }: { result: TrackingResult }) {
  const points = result.events.filter(
    (event): event is typeof event & { lat: number; lng: number } =>
      event.lat !== null && event.lng !== null,
  );

  if (points.length < 2) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-mist p-8 text-center">
        <p className="max-w-[240px] text-[13px] text-ink-3">
          The route appears here once the consignment has been picked up and scanned.
        </p>
      </div>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;

  const project = (lat: number, lng: number) => ({
    x: 70 + ((lng - minLng) / spanLng) * 460,
    y: 310 - ((lat - minLat) / spanLat) * 250,
  });

  const coords = points.map((p) => project(p.lat, p.lng));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const done = ["delivered", "failed"].includes(result.status);

  return (
    <svg viewBox="0 0 600 380" className="h-full w-full bg-mist" role="img"
         aria-label={`Schematic route from ${result.origin_city} to ${result.destination_city}`}>
      <defs>
        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="#101014" opacity="0.10" />
        </pattern>
      </defs>
      <rect width="600" height="380" fill="url(#grid)" />

      <path d={path} fill="none" stroke="#101014" strokeOpacity="0.18" strokeWidth="6" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#E1252B" strokeWidth="2.5" strokeLinecap="round" />

      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="4.5" fill="#fff" stroke="#101014" strokeWidth="1.5" />
      ))}

      <circle cx={last.x} cy={last.y} r="7" fill="#E1252B" />
      {!done && (
        <circle cx={last.x} cy={last.y} r="7" fill="none" stroke="#E1252B" strokeWidth="2">
          <animate attributeName="r" values="7;18" dur="1.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="1.9s" repeatCount="indefinite" />
        </circle>
      )}

      <text x={coords[0].x} y={coords[0].y + 22} fontSize="12" fill="#4a4a55" textAnchor="middle">
        {result.origin_city}
      </text>
      <text x={last.x} y={last.y - 16} fontSize="12" fontWeight="600" fill="#101014" textAnchor="middle">
        {done ? result.destination_city : "Current position"}
      </text>
      <text x="588" y="368" fontSize="10" fill="#7a7a88" textAnchor="end">
        Schematic route — not to scale
      </text>
    </svg>
  );
}
