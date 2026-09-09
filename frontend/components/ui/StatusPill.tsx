import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  delivered: "bg-success-soft text-success",
  in_transit: "bg-info-soft text-info",
  out_for_delivery: "bg-info-soft text-info",
  picked_up: "bg-warning-soft text-warning",
  booked: "bg-mist text-ink-2",
  delayed: "bg-danger-soft text-danger",
  failed: "bg-danger-soft text-danger",
  // Invoice + payment states share the component.
  paid: "bg-success-soft text-success",
  captured: "bg-success-soft text-success",
  sent: "bg-info-soft text-info",
  draft: "bg-mist text-ink-2",
  overdue: "bg-danger-soft text-danger",
  void: "bg-mist text-ink-3",
  open: "bg-warning-soft text-warning",
  in_progress: "bg-info-soft text-info",
  resolved: "bg-success-soft text-success",
  closed: "bg-mist text-ink-3",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-wide",
        TONES[status] ?? "bg-mist text-ink-2",
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
