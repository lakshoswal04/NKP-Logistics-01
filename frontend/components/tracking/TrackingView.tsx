"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { TrackingMap } from "@/components/tracking/TrackingMap";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApiError, fetchTracking } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackingId = searchParams.get("id")?.trim() ?? "";
  const [input, setInput] = useState(trackingId);
  const [syncedId, setSyncedId] = useState(trackingId);

  // Keep the field in step when the id changes from outside this component — a
  // back/forward navigation, or a link from elsewhere on the site. Adjusting
  // state during render (rather than in an effect) is React's documented
  // pattern for this: it re-renders before committing, with no extra paint.
  if (syncedId !== trackingId) {
    setSyncedId(trackingId);
    setInput(trackingId);
  }

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["tracking", trackingId],
    queryFn: () => fetchTracking(trackingId),
    enabled: trackingId.length > 0,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });

  const notFound = isError && error instanceof ApiError && error.status === 404;

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const id = input.trim();
          if (id) router.push(`/track?id=${encodeURIComponent(id)}`);
        }}
      >
        <label htmlFor="track-id" className="sr-only">
          Tracking reference
        </label>
        <input
          id="track-id"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="AWB, order ID or LRN — e.g. NKP2026A1B2"
          autoComplete="off"
          className="w-full border border-line-strong bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none sm:max-w-[420px]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-ink px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:opacity-40"
        >
          Track
        </button>
      </form>

      {!trackingId && (
        <Card tone="mist" className="p-8">
          <p className="text-[14px] text-ink-2">
            Enter a reference above to see the consignment&rsquo;s scan history and current
            position. Try{" "}
            <button
              type="button"
              onClick={() => router.push("/track?id=NKP2026A1B2")}
              className="font-semibold text-brand underline underline-offset-2"
            >
              NKP2026A1B2
            </button>{" "}
            for a live example.
          </p>
        </Card>
      )}

      {trackingId && isPending && (
        <Card className="p-8">
          <p className="text-[14px] text-ink-3">Looking up {trackingId}…</p>
        </Card>
      )}

      {notFound && (
        <Card className="border-danger/30 bg-danger-soft p-8">
          <h2 className="font-display text-[19px] font-bold text-ink">No consignment found</h2>
          <p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-ink-2">
            We have nothing against <span className="font-semibold">{trackingId}</span>. References
            can take a few hours to appear after dispatch. If it still shows nothing tomorrow,{" "}
            <a href="/support#raise" className="font-semibold text-brand underline underline-offset-2">
              raise a query
            </a>{" "}
            and we will trace it.
          </p>
        </Card>
      )}

      {isError && !notFound && (
        <Card className="border-danger/30 bg-danger-soft p-8">
          <p className="text-[14px] text-ink-2">
            Tracking is temporarily unavailable. Please try again in a moment.
          </p>
        </Card>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden">
            <TrackingMap result={data} />
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Reference</p>
                  <p className="mt-1 font-display text-[20px] font-bold text-ink">
                    {data.tracking_id}
                  </p>
                </div>
                <StatusPill status={data.status} />
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-line pt-5">
                {[
                  ["From", data.origin_city],
                  ["To", data.destination_city],
                  ["Picked up", formatDate(data.pickup_date)],
                  ["Expected", formatDate(data.eta)],
                  ["Vehicle", data.vehicle_type ?? "—"],
                  ["Driver", data.driver_name ?? "Being assigned"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11.5px] uppercase tracking-wide text-ink-3">{label}</dt>
                    <dd className="mt-1 text-[13.5px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="mb-5 font-display text-[15px] font-bold text-ink">Scan history</h2>
              <TrackingTimeline events={data.events} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
