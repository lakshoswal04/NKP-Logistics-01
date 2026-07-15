"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Signature hotspot-annotation motif (PRD §11.3): a circular white marker
 * connected by a 1px line to a floating glass spec-card. Used ONLY on the
 * Home hero and the tracking map.
 */
export function Hotspot({
  x,
  y,
  label,
  detail,
  side = "right",
  delay = 0,
}: {
  /** Percentage position within the relative parent. */
  x: string;
  y: string;
  label: string;
  detail?: string;
  side?: "left" | "right";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="absolute z-10"
      style={{ left: x, top: y }}
      initial={reduced ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <span className="relative block size-4">
        <span className="absolute inset-0 rounded-full bg-white shadow-[0_0_12px_rgb(255_255_255/0.8)]" />
        <span className="absolute -inset-1.5 animate-ping rounded-full bg-white/30 motion-reduce:animate-none" />
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute top-2 h-px w-10 bg-white/40",
          side === "right" ? "left-4" : "right-4",
        )}
      />
      <div
        className={cn(
          "glass absolute top-[-0.4rem] w-max max-w-48 rounded-xl px-3.5 py-2.5",
          side === "right" ? "left-14" : "right-14",
        )}
      >
        <p className="text-xs font-semibold text-ink">{label}</p>
        {detail && <p className="mt-0.5 text-[11px] leading-snug text-ink-2">{detail}</p>}
      </div>
    </motion.div>
  );
}
