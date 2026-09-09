import Image from "next/image";
import type { Metadata } from "next";

import { CtaBand } from "@/components/site/CtaBand";
import { HomeHero } from "@/components/site/HomeHero";
import { OffsetFigure } from "@/components/site/OffsetFigure";
import { StatBand } from "@/components/site/StatBand";
import { ArrowLink, Button } from "@/components/ui/Button";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CAPABILITIES, SOLUTIONS } from "@/lib/content";

export const metadata: Metadata = {
  title: "NKP Logistics — Warehousing & fulfilment across India",
  description:
    "42 multi-client fulfilment centres, 7.4 Mn+ sq ft of racking and one warehouse management " +
    "system. Storage, pick-pack, inventory control, returns and outbound distribution for D2C, " +
    "B2B and marketplace brands.",
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <StatBand />

      {/* Who we build for — dark band */}
      <Section tone="ink" id="solutions">
        <SectionHeading lead="Built for the way" strong="Indian commerce actually ships" inverse />
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {SOLUTIONS.map((solution, index) => (
            <Reveal key={solution.slug} delay={index * 0.06}>
              <div>
                <span className="block h-[3px] w-10 bg-brand" aria-hidden />
                <h3 className="mt-5 font-display text-[21px] font-bold text-white">
                  {solution.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-white/70">{solution.blurb}</p>
                <ArrowLink
                  href="/services/warehousing#solutions"
                  tone="inverse"
                  className="mt-5"
                >
                  Know more
                </ArrowLink>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Capabilities grid — photo cards on mist */}
      <Section tone="mist">
        <div className="grid gap-12 lg:grid-cols-[340px_1fr]">
          <div>
            <SectionHeading lead="What happens" strong="inside our fulfilment centres" />
            <p className="mt-6 max-w-[280px] text-[14px] leading-relaxed text-ink-2">
              Warehousing is the whole business, not a line item next to nine other services. Every
              capability below runs on our own floor.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {CAPABILITIES.map((capability, index) => (
              <Reveal key={capability.slug} delay={index * 0.04}>
                <article className="flex h-full flex-col bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={capability.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="photo-caption absolute inset-x-0 bottom-0 p-4" aria-hidden={false}>
                      <h3 className="font-display text-[15.5px] font-bold text-white">
                        {capability.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[13.5px] leading-relaxed text-ink-2">{capability.blurb}</p>
                    <ArrowLink href="/services/warehousing" tone="ink" className="mt-5">
                      Know more
                    </ArrowLink>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Split-offset feature — the AI tab */}
      <Section tone="paper">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>AI Control Tower</Eyebrow>
              <SectionHeading lead="Ask your warehouse" strong="a question, get an answer" />
              <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-ink-2">
                Not a chatbot bolted onto a marketing site. The control tower reads your live stock,
                invoices and consignments, extracts line items from a supplier PDF, scores a messy
                delivery address before it becomes an RTO, and drafts the customer email when a
                consignment slips.
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {[
                  "Ops copilot with real access to your data",
                  "Document intake — PO or packing list to draft invoice",
                  "Address intelligence and RTO risk scoring",
                  "Fulfilment-centre placement modelling",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-ink-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Button href="/ai" className="mt-8" withArrow>
                Open the control tower
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <OffsetFigure
              src="/media/ops-picker.jpg"
              alt="An operator picking stock from bin racking"
            />
          </Reveal>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
