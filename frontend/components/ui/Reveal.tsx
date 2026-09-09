"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { STATIC, VIEWPORT, riseIn, stagger } from "@/lib/motion";

/** Fade-and-rise on scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={riseIn}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger a list of children in.
 *
 * Preferred over giving each child its own `delay={i * n}`: the stagger is
 * declared once on the parent, and children enter relative to when the group
 * scrolls in rather than to page load.
 */
export function RevealGroup({
  children,
  gap = 0.07,
  delay = 0,
  className,
}: {
  children: ReactNode;
  gap?: number;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? STATIC : stagger(gap, delay)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

/** A child of RevealGroup. Inherits the parent's stagger timing. */
export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={riseIn}>
      {children}
    </motion.div>
  );
}
