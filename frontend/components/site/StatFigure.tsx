"use client";

import { cn } from "@/lib/cn";
import { useCountUp } from "@/lib/useCountUp";

/**
 * A single animated statistic.
 *
 * The figure counts up when it scrolls into view, and renders its final value
 * immediately under reduced motion — a stat frozen at zero would be worse than
 * no animation at all.
 */
export function StatFigure({
  value,
  label,
  inverse = false,
  className,
}: {
  value: string;
  label: string;
  inverse?: boolean;
  className?: string;
}) {
  const { ref, display } = useCountUp(value);

  return (
    <div className={className}>
      <span
        ref={ref}
        className={cn(
          "block font-display text-[34px] font-bold leading-none tabular-nums lg:text-[42px]",
          inverse ? "text-ink-inverse" : "text-ink",
        )}
      >
        {display}
      </span>
      <span
        className={cn(
          "mt-3 block max-w-[190px] text-[12.5px] leading-relaxed",
          inverse ? "text-ink-inverse-2" : "text-ink-2",
        )}
      >
        {label}
      </span>
    </div>
  );
}
