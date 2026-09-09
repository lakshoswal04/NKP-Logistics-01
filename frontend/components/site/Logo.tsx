import { cn } from "@/lib/cn";

/**
 * Wordmark. The red bar replacing the crossbar of the A-frame mark reads as
 * a loading ramp; at small sizes it just reads as a brand accent.
 */
export function Logo({ className, inverse = true }: { className?: string; inverse?: boolean }) {
  return (
    <span
      className={cn(
        "font-display text-[19px] font-bold uppercase tracking-[0.04em] leading-none",
        inverse ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="text-brand">NKP</span> Logistics
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="3" fill="#101014" />
      <path d="M7 23V9h3.2l7.4 9.1V9H21v14h-3.2L10.4 14v9H7Z" fill="#fff" />
      <rect x="7" y="24.5" width="18" height="2.5" fill="#E1252B" />
    </svg>
  );
}
