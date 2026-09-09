import type { Variants } from "framer-motion";

/**
 * Shared motion vocabulary.
 *
 * One easing and a small set of variants, so the whole site moves the same way.
 * Durations are deliberately short — an earlier iteration of this site had a
 * 1.55s staggered hero tail, which read as a slow page rather than a polished
 * one.
 *
 * Every consumer must still check `useReducedMotion()`. The global CSS
 * media-query kill-switch only reaches CSS animation and transition; it does
 * nothing to JS-driven values.
 */

/** Gentle deceleration — the same curve as the CSS keyframes in globals.css. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const VIEWPORT = { once: true, margin: "-80px" } as const;

/** Fade and rise. The default entrance for a block of content. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Parent that staggers its children's entrances. */
export const stagger = (gap = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/**
 * A headline line rising out of a mask.
 *
 * The parent must clip (`overflow-hidden`) for the mask to read — the line
 * translates from fully below its own box, so without clipping it simply slides
 * in from nowhere.
 */
export const lineRise: Variants = {
  hidden: { y: "110%" },
  show: { y: 0, transition: { duration: 0.75, ease: EASE } },
};

/** Scale-in for photographs, paired with a rounded, clipping wrapper. */
export const imageIn: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE } },
};

/** Static equivalents, for when reduced motion is requested. */
export const STATIC: Variants = { hidden: {}, show: {} };
