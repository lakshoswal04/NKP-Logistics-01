import Image from "next/image";
import type { Metadata } from "next";

import { AlertTicker } from "@/components/site/AlertTicker";
import { CtaBand } from "@/components/site/CtaBand";
import { HomeHero } from "@/components/site/HomeHero";
import { OffsetFigure } from "@/components/site/OffsetFigure";
import { ArrowLink, Button } from "@/components/ui/Button";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
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
      <AlertTicker />

      {/* Who we build for */}
      <Section tone="paper" id="solutions">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <Eyebrow>Who we build for</Eyebrow>
            <SectionHeading lead="Built for the way" strong="Indian commerce actually ships" />
          </div>
          <RevealGroup className="flex flex-col gap-10 pt-2" gap={0.08}>
            {SOLUTIONS.map((solution) => (
              <RevealItem key={solution.slug}>
                <div className="border-t border-line pt-6">
                  <h3 className="font-display text-[22px] font-bold text-ink">{solution.title}</h3>
                  <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-ink-2">
                    {solution.blurb}
                  </p>
                  <ArrowLink href="/services/warehousing#solutions" tone="ink" className="mt-5">
                    Know more
                  </ArrowLink>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      {/* Capability cards */}
      <Section tone="mist">
        <div className="max-w-[640px]">
          <Eyebrow>Inside the fulfilment centre</Eyebrow>
          <SectionHeading lead="Warehousing is the whole business," strong="not a line item" />
          <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
            Every capability below runs on our own floor, under one warehouse management system.
          </p>
        </div>

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" gap={0.05}>
          {CAPABILITIES.map((capability) => (
            <RevealItem key={capability.slug} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-paper">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={capability.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="photo-caption absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-[16px] font-bold text-ink-inverse">
                      {capability.title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{capability.blurb}</p>
                  <ArrowLink href="/services/warehousing" tone="ink" className="mt-5">
                    Know more
                  </ArrowLink>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* AI Control Tower */}
      <Section tone="paper">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>AI Control Tower</Eyebrow>
              <SectionHeading lead="Ask your warehouse a question," strong="get a real answer" />
              <p className="mt-6 max-w-[500px] text-[15px] leading-relaxed text-ink-2">
                Not a chatbot bolted onto a marketing site. The control tower reads your live stock,
                invoices and consignments, scores a messy delivery address before it becomes an RTO,
                and drafts the customer email when a consignment slips.
              </p>
              <ul className="mt-8 flex flex-col gap-3.5">
                {[
                  "Ops copilot with real access to your data",
                  "Address intelligence and RTO risk scoring",
                  "Fulfilment-centre placement modelling",
                  "Support triage grounded in the knowledge base",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-ink-2">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <Button href="/ai" variant="dark" size="lg" className="mt-9" withBadge>
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

      {/* Angled accent band */}
      <Section tone="brand" className="corner-cut" innerClassName="text-center">
        <Reveal>
          <p className="eyebrow mb-6 text-paper/80">Why it matters</p>
          <h2 className="mx-auto max-w-[860px] font-display text-[32px] font-bold leading-[1.06] tracking-[-0.03em] text-paper sm:text-[42px] lg:text-[50px]">
            Every day stock sits in the wrong city is a delivery promise you cannot make.
          </h2>
          <p className="mx-auto mt-7 max-w-[620px] text-[15.5px] leading-relaxed text-paper/90">
            Splitting inventory across regional fulfilment centres shortens the delivery radius,
            lowers freight cost, and turns next-day from a premium into the default. We model the
            split against your real order distribution before you commit to anything.
          </p>
          <Button href="/contact" variant="light" size="lg" className="mt-10" withBadge>
            Model my network
          </Button>
        </Reveal>
      </Section>

      <CtaBand />
    </>
  );
}
