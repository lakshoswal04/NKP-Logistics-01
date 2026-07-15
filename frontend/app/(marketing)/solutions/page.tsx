import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { INDUSTRIES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Solutions by Industry",
  description:
    "Logistics solutions tailored for manufacturers, distributors, retail chains, wholesalers, SMEs and import/export businesses.",
};

export default function SolutionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Solutions"
        title="Built around how your industry actually moves"
        text="The same platform, configured for your lanes, delivery windows and compliance needs."
      />
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.slug} delay={i * 0.05}>
              <GlassCard className="flex h-full flex-col p-7">
                <h2 className="font-display text-xl font-semibold">{ind.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{ind.blurb}</p>
                <div className="mt-5">
                  <Button
                    href={`/contact?industry=${encodeURIComponent(ind.title)}`}
                    variant="secondary"
                    className="px-5 py-2.5"
                  >
                    Get a Free Consultation
                  </Button>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
