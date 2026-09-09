"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Count a formatted figure up when it scrolls into view.
 *
 * Works on strings like "7.4 Mn+", "19,100+" and "99.4%" by isolating the
 * leading number, animating it, and re-inserting it into the original string —
 * so prefixes, suffixes and units survive untouched and no caller has to
 * decompose its own copy.
 *
 * The animated value is held as `null` until the animation actually starts, and
 * the hook returns `animated ?? value`. That means the real figure renders
 * immediately when reduced motion is set, when the element has not been seen
 * yet, or when the string has no number to animate — and it keeps the only
 * setState inside the rAF callback rather than in the effect body, which would
 * force an extra render pass on mount.
 */
export function useCountUp(value: string, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState<string | null>(null);

  useEffect(() => {
    if (!inView || reduced) return;

    const match = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return;

    const [, prefix, rawNumber, suffix] = match;
    const target = Number(rawNumber.replace(/,/g, ""));
    if (!Number.isFinite(target)) return;

    const decimals = rawNumber.includes(".") ? rawNumber.split(".")[1].length : 0;
    const grouped = rawNumber.includes(",");
    const start = performance.now();
    let frame = 0;

    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      // en-IN grouping, to match the lakh/crore convention used elsewhere.
      return grouped ? Number(fixed).toLocaleString("en-IN") : fixed;
    };

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic: fast start, soft landing on the real figure.
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(`${prefix}${format(target * eased)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, durationMs]);

  return { ref, display: animated ?? value };
}
