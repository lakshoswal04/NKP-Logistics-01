"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchRoutePlan, type RoutePlan } from "@/lib/aiApi";
import { ModuleShell, ResultSkeleton, SERIES } from "@/components/ai/Primitives";

const DEMO_REQUEST = {
  depot: "Mumbai",
  stops: [
    { shipment_ref: "NKP-101", city: "Pune", load_kg: 700 },
    { shipment_ref: "NKP-102", city: "Ahmedabad", load_kg: 550 },
    { shipment_ref: "NKP-103", city: "Nashik", load_kg: 450 },
    { shipment_ref: "NKP-104", city: "Surat", load_kg: 850 },
    { shipment_ref: "NKP-105", city: "Vadodara", load_kg: 600 },
    { shipment_ref: "NKP-106", city: "Indore", load_kg: 500 },
    { shipment_ref: "NKP-107", city: "Nagpur", load_kg: 400 },
    { shipment_ref: "NKP-108", city: "Hyderabad", load_kg: 650 },
  ],
  vehicles: [
    { name: "Truck A", capacity_kg: 2400 },
    { name: "Truck B", capacity_kg: 2400 },
    { name: "Truck C", capacity_kg: 2400 },
  ],
};

function project(plan: RoutePlan) {
  const pts: { lat: number; lng: number }[] = [
    { lat: plan.depot_lat, lng: plan.depot_lng },
    ...plan.routes.flatMap((r) => r.stops.map((s) => ({ lat: s.lat, lng: s.lng }))),
  ];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const spanLat = Math.max(maxLat - minLat, 0.01);
  const spanLng = Math.max(maxLng - minLng, 0.01);
  return (lat: number, lng: number) => ({
    x: 56 + ((lng - minLng) / spanLng) * 488,
    y: 300 - ((lat - minLat) / spanLat) * 252,
  });
}

export function RouteModule({ badge }: { badge?: string }) {
  const m = useMutation({ mutationFn: () => fetchRoutePlan(DEMO_REQUEST) });
  const plan = m.data;

  return (
    <ModuleShell
      index={1}
      title="AI Route Optimization"
      tagline="Every dispatch plan is solved, not guessed — fewer empty kilometres."
      badge={badge}
      className="lg:col-span-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          Demo batch: 8 shipments out of Mumbai, 3 trucks of 2.4t capacity.
        </p>
        <button
          onClick={() => m.mutate()}
          disabled={m.isPending}
          className="rounded-[10px] bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {m.isPending ? "Solving…" : "Optimize dispatch"}
        </button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-xl" style={{ background: "#0d0d11" }}>
          {m.isPending && (
            <div className="p-6">
              <ResultSkeleton lines={5} />
            </div>
          )}
          {!plan && !m.isPending && (
            <div className="flex h-64 items-center justify-center text-sm text-ink-3">
              Run the optimizer to see the vehicle routes.
            </div>
          )}
          {plan && (
            <svg viewBox="0 0 600 340" className="h-auto w-full" role="img" aria-label="Optimized vehicle routes">
              <defs>
                <pattern id="rt-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.2" fill="#FFFFFF" fillOpacity="0.06" />
                </pattern>
              </defs>
              <rect width="600" height="340" fill="url(#rt-dots)" />
              {(() => {
                const proj = project(plan);
                const depot = proj(plan.depot_lat, plan.depot_lng);
                return (
                  <>
                    {plan.routes.map((r, vi) => {
                      const color = SERIES[vi % SERIES.length];
                      const pts = [depot, ...r.stops.map((s) => proj(s.lat, s.lng)), depot];
                      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                      return (
                        <g key={r.vehicle}>
                          <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.9" />
                          {r.stops.map((s) => {
                            const p = proj(s.lat, s.lng);
                            return (
                              <g key={s.shipment_ref}>
                                {/* 2px surface ring so overlapping marks stay separable */}
                                <circle cx={p.x} cy={p.y} r="7" fill="#0d0d11" />
                                <circle cx={p.x} cy={p.y} r="5" fill={color} />
                                <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="10.5" fill="#9a9aa5">
                                  {s.city}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                    <rect x={depot.x - 6} y={depot.y - 6} width="12" height="12" rx="2.5" fill="#F5F5F7" />
                    <text x={depot.x} y={depot.y + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#F5F5F7">
                      {plan.depot} (depot)
                    </text>
                  </>
                );
              })()}
            </svg>
          )}
        </div>

        <div>
          {plan ? (
            <div className="space-y-3">
              <div className="flex gap-6">
                <div>
                  <p className="font-display text-2xl font-semibold text-success">
                    −{Math.round(plan.distance_saved_km).toLocaleString("en-IN")} km
                  </p>
                  <p className="text-xs text-ink-2">vs unoptimized dispatch</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold">
                    {Math.round(plan.total_distance_km).toLocaleString("en-IN")} km
                  </p>
                  <p className="text-xs text-ink-2">total planned</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {plan.routes.map((r, vi) => (
                  <li key={r.vehicle} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: SERIES[vi % SERIES.length] }} />
                        {r.vehicle}
                      </span>
                      <span className="text-xs text-ink-3">
                        {Math.round(r.distance_km)} km · {Math.round(r.utilization * 100)}% full
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                      {r.stops.length
                        ? r.stops.map((s) => s.city).join(" → ")
                        : "Held in reserve"}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-ink-3">Solver: {plan.solver}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-3">
              The solver weighs distance, capacity and stop order across the whole batch at once —
              the kind of decision a dispatcher can&apos;t hold in their head.
            </p>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
