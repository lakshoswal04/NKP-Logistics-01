import type { TrackingEvent } from "@/lib/api";
import { cn } from "@/lib/cn";

const DOT: Record<string, string> = {
  delivered: "bg-success",
  delayed: "bg-danger",
  failed: "bg-danger",
};

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  const ordered = [...events].reverse(); // latest first
  return (
    <ol className="space-y-0">
      {ordered.map((ev, i) => (
        <li key={`${ev.status}-${ev.occurred_at}`} className="relative flex gap-4 pb-6 last:pb-0">
          {i < ordered.length - 1 && (
            <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line" />
          )}
          <span
            aria-hidden
            className={cn(
              "relative mt-1.5 block size-[11px] shrink-0 rounded-full",
              DOT[ev.status] ?? (i === 0 ? "bg-accent" : "bg-ink-3"),
              i === 0 && "shadow-[0_0_10px_rgb(46_91_255/0.9)]",
            )}
          />
          <div>
            <p className={cn("text-sm font-medium", i === 0 ? "text-ink" : "text-ink-2")}>
              {ev.description ?? ev.status.replaceAll("_", " ")}
            </p>
            <p className="mt-0.5 text-xs text-ink-3">
              {ev.location && <span>{ev.location} · </span>}
              {new Date(ev.occurred_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
