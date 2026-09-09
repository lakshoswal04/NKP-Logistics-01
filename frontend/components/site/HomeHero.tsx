"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { StatFigure } from "@/components/site/StatFigure";
import { TrackWidget } from "@/components/site/TrackWidget";
import { Button } from "@/components/ui/Button";
import { EASE, lineRise, stagger } from "@/lib/motion";
import { STATS } from "@/lib/content";

const HEADLINE = ["India's inventory", "needs a better address"];
const CHIPS = ["Warehousing", "Fulfilment", "Inventory", "Returns", "Distribution"] as const;

export function HomeHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallax: the photograph drifts at ~30% of scroll speed and fades slightly,
  // so the content below appears to slide over it.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative isolate min-h-[92svh] overflow-hidden bg-void">
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduced ? undefined : { y: photoY }}
      >
        <div className="relative h-[118%] w-full">
          <Image
            src="/media/hero-aisle-cinematic.jpg"
            alt="A stocked racking aisle running the length of an NKP fulfilment centre"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center brightness-[0.92] saturate-[0.85] motion-safe:animate-ken-burns"
          />
        </div>
        <div className="cine-scrim absolute inset-0" aria-hidden />
      </motion.div>

      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="mx-auto flex min-h-[92svh] max-w-[1240px] flex-col justify-end px-6 pb-12 pt-32"
      >
        <div className="flex flex-1 flex-col justify-center gap-10 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[760px]">
            <motion.h1
              variants={reduced ? undefined : stagger(0.09, 0.15)}
              initial={reduced ? undefined : "hidden"}
              animate={reduced ? undefined : "show"}
              className="font-display text-[38px] font-bold leading-[1.0] tracking-[-0.035em] text-ink-inverse sm:text-[50px] lg:text-[62px]"
            >
              {HEADLINE.map((line) => (
                // Each line clips its own child so the rise reads as a mask.
                <span key={line} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    variants={reduced ? undefined : lineRise}
                    className="block"
                  >
                    <span className="whitespace-nowrap">{line}</span>
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 18 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
            >
              <p className="mt-7 max-w-[500px] text-[16px] leading-relaxed text-ink-inverse-2 sm:text-[17px]">
                42 multi-client fulfilment centres, one warehouse management system, and stock held
                close enough to your customers that next-day stops being a premium.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button href="/contact" variant="light" size="lg" withBadge>
                  Model my network
                </Button>
                <Button href="/services/warehousing" variant="ghost" size="lg"
                        className="text-ink-inverse hover:text-brand">
                  Explore warehousing
                </Button>
              </div>

              <ul className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2">
                {CHIPS.map((chip, index) => (
                  <li key={chip} className="flex items-center gap-3">
                    {index > 0 && <span className="chip-sep" aria-hidden />}
                    <span className="text-[13.5px] font-medium text-ink-inverse-2">{chip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 26 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
            className="w-full shrink-0 lg:w-[400px]"
          >
            <TrackWidget />
          </motion.div>
        </div>

        {/* Stats overlay the darkened lower edge of the photograph. */}
        <motion.dl
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}
          className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line-inverse pt-8 md:grid-cols-3 lg:grid-cols-5"
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
