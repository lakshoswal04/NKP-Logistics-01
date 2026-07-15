import { cn } from "@/lib/cn";
import type { ShipmentStatus } from "@/lib/api";

const tone: Record<string, string> = {
  delivered: "bg-success/15 text-success",
  in_transit: "bg-accent/15 text-accent-hover",
  out_for_delivery: "bg-accent/15 text-accent-hover",
  picked_up: "bg-warning/15 text-warning",
  booked: "bg-warning/15 text-warning",
  delayed: "bg-danger/15 text-danger",
  failed: "bg-danger/15 text-danger",
};

export function StatusPill({ status, className }: { status: ShipmentStatus | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium lowercase",
        tone[status] ?? "bg-white/10 text-ink-2",
        className,
      )}
    >
      {String(status).replaceAll("_", " ")}
    </span>
  );
}
