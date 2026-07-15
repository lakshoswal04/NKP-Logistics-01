"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError, fetchTracking } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { TrackingMap } from "@/components/tracking/TrackingMap";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingView() {
  const router = useRouter();
  const params = useSearchParams();
  const trackingId = params.get("id")?.trim() ?? "";
  const [input, setInput] = useState(trackingId);

  const { data, error, isFetching } = useQuery({
    queryKey: ["tracking", trackingId],
    queryFn: () => fetchTracking(trackingId),
    enabled: trackingId.length > 0,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) router.push(`/track?id=${encodeURIComponent(input.trim())}`);
        }}
      >
        <label htmlFor="track-id" className="sr-only">
          Tracking ID
        </label>
        <input
          id="track-id"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. NKP2026A1B2"
          className="glass w-full rounded-[10px] px-4 py-3 text-sm placeholder:text-ink-3"
        />
        <button
          type="submit"
          disabled={isFetching}
          className="shrink-0 rounded-[10px] bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {isFetching ? "Tracking…" : "Track Now"}
        </button>
      </form>

      {notFound && (
        <GlassCard className="mt-10 max-w-xl p-8 text-center">
          <h2 className="font-display text-xl font-semibold">No shipment found</h2>
          <p className="mt-2 text-sm text-ink-2">
            We couldn&apos;t find a shipment for <span className="text-ink">{trackingId}</span>. Check the
            ID for typos, or{" "}
            <Link href="/contact" className="text-accent hover:text-accent-hover">
              contact support
            </Link>{" "}
            and we&apos;ll trace it for you.
          </p>
        </GlassCard>
      )}

      {error && !notFound && (
        <GlassCard className="mt-10 max-w-xl p-8 text-center">
          <p className="text-sm text-ink-2">
            Something went wrong while fetching tracking data. Please try again in a moment.
          </p>
        </GlassCard>
      )}

      {data && (
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <TrackingMap result={data} />

          <div className="space-y-6">
            <GlassCard className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Shipment</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{data.tracking_id}</h2>
                </div>
                <StatusPill status={data.status} />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div>
                  <dt className="text-ink-3">From</dt>
                  <dd className="mt-0.5 font-medium">{data.origin_city}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">To</dt>
                  <dd className="mt-0.5 font-medium">{data.destination_city}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Picked up</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(data.pickup_date)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">ETA</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(data.eta)}
                    {data.eta && <span className="ml-1 text-xs text-ink-3">(AI estimate)</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-3">Vehicle</dt>
                  <dd className="mt-0.5 font-medium">{data.vehicle_type ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Driver</dt>
                  <dd className="mt-0.5 font-medium">{data.driver_name ?? "Being assigned"}</dd>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="p-7">
              <p className="eyebrow mb-5">Timeline</p>
              <TrackingTimeline events={data.events} />
            </GlassCard>
          </div>
        </div>
      )}
    </section>
  );
}
