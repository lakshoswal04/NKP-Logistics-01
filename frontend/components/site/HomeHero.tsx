"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { StatFigure } from "@/components/site/StatFigure";
import { Button } from "@/components/ui/Button";
import { EASE, lineRise, stagger } from "@/lib/motion";
import { STATS } from "@/lib/content";

/**
 * Full-viewport hero.
 *
 * Deliberately spare: a headline, a paragraph, two actions and three figures.
 * An earlier version also floated a tracking widget over the photograph, which
 * is the defining element of a well-known competitor's homepage and made the
 * whole page read as an imitation of it however the rest was styled. Tracking
 * lives in the nav, on /track, and in a slim bar further down this page.
 */

const HEADLINE = ["India's inventory", "needs a", "better address"];

export function HomeHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);

  return (
    <section ref={ref} className="relative isolate min-h-[94svh] overflow-hidden bg-void">
      <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { y: photoY }}>
        <div className="relative h-[116%] w-full">
          <Image
            src="/media/hero-dock.jpg"
            alt="Numbered loading bays along the dock apron of an NKP fulfilment centre"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-[1.02] saturate-[0.92] motion-safe:animate-ken-burns"
          />
        </div>
        <div className="cine-scrim absolute inset-0" aria-hidden />
      </motion.div>

      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="mx-auto flex min-h-[94svh] max-w-[1240px] flex-col justify-between px-6 pb-14 pt-36"
      >
        <div className="flex flex-1 flex-col justify-center py-12">
          <motion.h1
            variants={reduced ? undefined : stagger(0.09, 0.15)}
            initial={reduced ? undefined : "hidden"}
            animate={reduced ? undefined : "show"}
            className="max-w-[16ch] font-display text-[44px] font-bold leading-[0.96] tracking-[-0.04em] text-ink-inverse sm:text-[64px] lg:text-[84px]"
          >
            {HEADLINE.map((line) => (
              // Each line clips its own child, so the rise reads as a mask.
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span variants={reduced ? undefined : lineRise} className="block">
                  {line}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          >
            <p className="mt-8 max-w-[46ch] text-[16px] leading-relaxed text-ink-inverse-2 sm:text-[18px]">
              42 multi-client fulfilment centres, one warehouse management system, and stock held
              close enough to your customers that next-day stops being a premium.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href="/contact" variant="light" size="lg" withBadge>
                Model my network
              </Button>
              <Button
                href="/services/warehousing"
                variant="ghost"
                size="lg"
                className="text-ink-inverse hover:text-accent-on-dark"
              >
                Explore warehousing
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.dl
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.85 }}
          className="grid grid-cols-1 gap-x-10 gap-y-9 border-t border-line-inverse pt-9 sm:grid-cols-3"
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <StatFigure value={stat.value} label={stat.label} inverse />
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
