import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { Playground } from "@/components/ai/Playground";

export const metadata: Metadata = {
  title: "AI & Technology",
  description:
    "Try NKP's AI layer live: route optimization, ETA and delay prediction, fraud detection, demand forecasting and an operations copilot — real models, real metrics.",
};

export default function TechnologyPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI & Technology"
        title="Don't take our word for it — try the models"
        text="Every feature below is running live against trained models. The accuracy badges are real held-out evaluation metrics, and every output is labelled for what it is: an estimate that assists a human decision."
      />

      {/* live playground */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/12 blur-3xl"
        />
        <Reveal>
          <Playground />
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <GlassCard className="p-8 md:p-12">
            <Eyebrow>Our guardrail</Eyebrow>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">
              AI on our platform assists — it never silently decides. Predictions are labelled as
              estimates, and every AI-suggested action that would change a shipment, price or
              account is confirmed by a person before it happens. Models currently train on a
              synthetic corpus modelled on Indian freight patterns and retrain on real network
              history as it accumulates.
            </p>
          </GlassCard>
        </Reveal>
      </section>

      <CtaBand title="See the platform in action" cta="Request a Demo" />
    </>
  );
}
