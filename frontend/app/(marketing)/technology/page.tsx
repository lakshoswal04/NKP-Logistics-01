import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { AI_FEATURES } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI & Technology",
  description:
    "The AI layer behind NKP Logistics: route optimization, ETA and delay prediction, fraud detection, demand forecasting and an operations copilot.",
};

export default function TechnologyPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI & Technology"
        title="Logistics decisions, made before problems happen"
        text="Every shipment on our network feeds models that plan routes, predict delays and flag risk — so our operations team acts early, and your deliveries arrive on time."
      />

      {/* AI core visual band */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AI_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <GlassCard className="h-full p-7">
                <span className="font-display text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 font-display text-lg font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <GlassCard className="p-8 md:p-12">
            <Eyebrow>Our guardrail</Eyebrow>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">
              AI on our platform assists — it never silently decides. Predictions are labelled as
              estimates, and every AI-suggested action that would change a shipment, price or
              account is confirmed by a person before it happens.
            </p>
          </GlassCard>
        </Reveal>
      </section>

      <CtaBand title="See the platform in action" cta="Request a Demo" />
    </>
  );
}
