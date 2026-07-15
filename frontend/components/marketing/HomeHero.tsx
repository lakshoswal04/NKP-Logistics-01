"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Hotspot } from "@/components/ui/Hotspot";
import { ContainerVisual } from "@/components/marketing/ContainerVisual";
import { TrackInput } from "@/components/marketing/TrackInput";

/**
 * Hero load-in sequence (PRD §11.5): chrome headline slides in, the container
 * visual settles into place, hotspot markers activate last.
 */
export function HomeHero() {
  const reduced = useReducedMotion();
  const anim = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: "easeOut" as const, delay },
        };

  return (
    <section className="relative overflow-hidden">
      {/* vignette frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_35%,rgb(46_91_255/0.10),transparent_70%)]"
      />
      <div className="mx-auto max-w-7xl px-6 pt-32 md:pt-36">
        {/* oversized chrome display headline */}
        <motion.h1
          {...anim(0)}
          className="chrome-text pointer-events-none select-none text-center font-display text-[17vw] font-bold uppercase leading-[0.9] tracking-tight md:text-[8.5rem] lg:text-[10.5rem]"
        >
          Move
          <br className="md:hidden" /> Smarter
        </motion.h1>

        {/* hero visual with hotspot annotations */}
        <motion.div
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, y: -32 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.9, ease: "easeOut" as const, delay: 0.35 },
              })}
          className="relative mx-auto -mt-[9vw] max-w-3xl md:-mt-24"
        >
          <ContainerVisual className="h-auto w-full" />
          <div className="hidden sm:block">
            <Hotspot x="30%" y="52%" side="left" label="GPS Tracked" detail="Live location on every trip" delay={1.15} />
            <Hotspot x="62%" y="68%" side="right" label="Insured" detail="Cargo cover available on booking" delay={1.35} />
            <Hotspot x="74%" y="47%" side="right" label="Temperature Controlled" detail="Cold-chain capable fleet" delay={1.55} />
          </div>
        </motion.div>

        {/* value line + CTAs */}
        <motion.div {...anim(0.6)} className="relative z-10 mx-auto -mt-4 max-w-2xl pb-20 text-center md:mt-2">
          <Eyebrow className="justify-center">AI-powered B2B logistics</Eyebrow>
          <p className="mt-4 text-lg leading-relaxed text-ink-2 md:text-xl">
            Freight, warehousing and last-mile across 220+ Indian cities — planned by AI, tracked
            live, delivered on time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact">Get a Quote</Button>
            <Button href="/services" variant="secondary">
              Explore All Services
            </Button>
          </div>
          <div className="mt-8 flex justify-center">
            <TrackInput />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
