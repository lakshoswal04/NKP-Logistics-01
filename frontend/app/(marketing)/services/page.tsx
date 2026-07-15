import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "FTL/LTL transportation, warehousing, last-mile delivery, reverse logistics, contract logistics and supply chain management across India.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Every service line your supply chain needs"
        text="From full truckloads on national lanes to the final kilometre into a store — run on one platform, tracked in one place."
      />
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((svc, i) => (
            <Reveal key={svc.slug} delay={i * 0.05}>
              <GlassCard className="flex h-full flex-col p-8">
                <h2 className="font-display text-2xl font-semibold">{svc.title}</h2>
                <p className="mt-2 text-ink-2">{svc.blurb}</p>
                <ul className="mt-5 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-2">
                      <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    href={`/contact?service=${encodeURIComponent(svc.title)}`}
                    variant="secondary"
                    className="px-5 py-2.5"
                  >
                    Talk to an Expert
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
