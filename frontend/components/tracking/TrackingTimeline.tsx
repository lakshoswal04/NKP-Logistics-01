import type { TrackingEvent } from "@/lib/api";

const DOT: Record<string, string> = {
  delivered: "bg-success",
  delayed: "bg-danger",
  failed: "bg-danger",
};

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <p className="text-[13.5px] text-ink-3">No scans recorded yet.</p>;
  }

  // Latest first — the newest scan is what someone opened the page to see.
  const ordered = [...events].reverse();

  return (
    <ol className="relative flex flex-col gap-6">
      <span className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-line" aria-hidden />
      {ordered.map((event, index) => (
        <li key={`${event.occurred_at}-${index}`} className="relative flex gap-4 pl-6">
          <span
            className={`absolute left-0 top-[5px] h-[11px] w-[11px] rounded-full ${
              DOT[event.status] ?? (index === 0 ? "bg-accent" : "bg-ink-3")
            }`}
            aria-hidden
          />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">
              {event.description ?? event.status.replaceAll("_", " ")}
            </p>
            <p className="mt-1 text-[12px] text-ink-3">
              {event.location ?? "In transit"} ·{" "}
              <time dateTime={event.occurred_at}>
                {new Date(event.occurred_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
