import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { CtaBand } from "@/components/marketing/CtaBand";
import { HomeHero } from "@/components/marketing/HomeHero";
import { HOW_IT_WORKS, SERVICES, STATS } from "@/lib/content";

const TRUSTED_BY = ["Veltrex Auto", "Suryan Pharma", "Kalpana Retail", "Mehta & Sons", "Orbix Electronics", "AgroLink"];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* stat strip */}
      <section className="border-y border-line bg-surface/60">
        <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} />
          ))}
        </Reveal>
      </section>

      {/* trusted-by row */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <p className="eyebrow text-center">Trusted by teams at</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="font-display text-lg font-semibold text-ink-3">
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            One connected system from booking to proof of delivery
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <GlassCard className="h-full p-6">
                <span className="font-display text-sm font-semibold text-accent">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* services grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>What we do</Eyebrow>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Logistics services for every stage of your supply chain
            </h2>
          </div>
          <Button href="/services" variant="secondary">
            Explore All Services
          </Button>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc, i) => (
            <Reveal key={svc.slug} delay={i * 0.06}>
              <Link href={`/contact?service=${encodeURIComponent(svc.title)}`} className="group block h-full">
                <GlassCard className="h-full p-6 transition-colors group-hover:border-white/20">
                  <h3 className="font-display text-lg font-semibold">{svc.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{svc.blurb}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-accent group-hover:text-accent-hover">
                    Talk to an expert →
                  </span>
                </GlassCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
