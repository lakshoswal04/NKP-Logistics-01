import Image from "next/image";
import type { Metadata } from "next";

import { CtaBand } from "@/components/site/CtaBand";
import { OffsetFigure } from "@/components/site/OffsetFigure";
import { WarehousingLeadForm } from "@/components/site/WarehousingLeadForm";
import { Button } from "@/components/ui/Button";
import { ADVANTAGE_ICONS } from "@/components/ui/Icons";
import { Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ADVANTAGES, CASE_STUDIES, FULFILMENT_STEPS, SOLUTIONS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Warehousing & fulfilment",
  description:
    "Multi-client warehousing across 42 Indian fulfilment centres — 7.4 Mn+ sq ft of racking, " +
    "one warehouse management system, inventory accuracy at 99.4%, and billing you can audit.",
};

export default function WarehousingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-ink">
        <div className="relative min-h-[420px] overflow-hidden lg:min-h-[480px]">
          <Image
            src="/media/hero-warehouse-aisle.jpg"
            alt="Staff walking a racking aisle inside an NKP fulfilment centre"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="hero-scrim-soft absolute inset-0" aria-hidden />
          <div className="relative mx-auto flex min-h-[420px] max-w-[1200px] items-center px-6 lg:min-h-[480px]">
            <div className="max-w-[560px] py-16 animate-fade-up">
              <h1 className="font-display text-[32px] font-semibold leading-[1.14] text-white sm:text-[42px] lg:text-[48px]">
                <span className="font-bold text-brand">Stock closer</span> to your customers
              </h1>
              <p className="mt-5 max-w-[470px] text-[16px] leading-relaxed text-white/80">
                A distributed fulfilment network that shortens the delivery radius, absorbs your
                festive peak, and gives you one honest view of inventory across every location.
              </p>
              <Button href="#enquire" variant="light" size="lg" className="mt-8" withArrow>
                Get started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + offset figure */}
      <Section tone="paper">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionHeading lead="End-to-end warehousing and" strong="distribution logistics" />
              <div className="mt-6 flex max-w-[500px] flex-col gap-4 text-[15px] leading-relaxed text-ink-2">
                <p>
                  Our fulfilment centres run on a single warehouse management system and sit on
                  lanes served by vetted delivery partners, so you can trade storage cost against
                  speed to the customer rather than accepting whatever one godown allows.
                </p>
                <p>
                  The practical effect is that you stop managing space, headcount and seasonal
                  overflow — and start managing the part of the business that actually grows it.
                </p>
              </div>
              <Button href="/contact" variant="dark" className="mt-8" withArrow>
                Contact us
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <OffsetFigure
              src="/media/fc-floor-wide.jpg"
              alt="Palletised stock across the floor of a fulfilment centre"
            />
          </Reveal>
        </div>
      </Section>

      {/* Advantage 2x2 on dark */}
      <Section tone="ink" id="advantage">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          <SectionHeading lead="The NKP" strong="Advantage" inverse />
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {ADVANTAGES.map((advantage, index) => {
              const Icon = ADVANTAGE_ICONS[index % ADVANTAGE_ICONS.length];
              return (
              <Reveal key={advantage.title} delay={index * 0.05}>
                <div>
                  <Icon className="text-brand" />
                  <h3 className="mt-5 max-w-[300px] font-display text-[17px] font-bold leading-snug text-white">
                    {advantage.title}
                  </h3>
                  <p className="mt-3 max-w-[320px] text-[13.5px] leading-relaxed text-white/65">
                    {advantage.body}
                  </p>
                </div>
              </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* How fulfilment works */}
      <Section tone="mist" id="fulfilment">
        <SectionHeading lead="How our" strong="order fulfilment actually works" />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FULFILMENT_STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.05}>
              <article className="flex h-full flex-col border-t-2 border-ink pt-5">
                <span className="font-display text-[13px] font-bold text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-[17px] font-bold text-ink">{step.title}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Who it's for */}
      <Section tone="paper" id="solutions">
        <SectionHeading lead="Solutions for" strong="how you sell" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SOLUTIONS.map((solution, index) => (
            <Reveal key={solution.slug} delay={index * 0.05}>
              <article className="flex h-full flex-col border border-line p-7 transition-colors hover:border-ink">
                <span className="block h-[3px] w-10 bg-brand" aria-hidden />
                <h3 className="mt-5 font-display text-[19px] font-bold text-ink">
                  {solution.title}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{solution.blurb}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Case studies */}
      <Section tone="mist">
        <SectionHeading strong="Case studies" />
        <div className="mt-12 flex flex-col gap-16">
          {CASE_STUDIES.map((study, index) => (
            <Reveal key={study.title} delay={0.04}>
              <article
                className={`grid items-center gap-10 lg:grid-cols-2 ${
                  index % 2 === 1 ? "lg:[&>figure]:order-first" : ""
                }`}
              >
                <div>
                  <h3 className="max-w-[440px] font-display text-[22px] font-bold leading-snug text-ink lg:text-[25px]">
                    {study.title}
                  </h3>
                  <p className="mt-5 max-w-[480px] text-[14.5px] leading-relaxed text-ink-2">
                    {study.body}
                  </p>
                  <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
                    {study.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt className="sr-only">{metric.label}</dt>
                        <dd>
                          <span className="block font-display text-[22px] font-bold text-ink">
                            {metric.value}
                          </span>
                          <span className="mt-1 block text-[12px] text-ink-3">{metric.label}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <figure className="relative aspect-[16/11] overflow-hidden">
                  <Image
                    src={study.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </figure>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Lead capture */}
      <Section tone="paper" id="enquire">
        <div className="grid gap-12 lg:grid-cols-[1fr_460px]">
          <div>
            <Eyebrow>Enquire</Eyebrow>
            <SectionHeading
              lead="Need a flexible, end-to-end"
              strong="warehousing solution?"
            />
            <p className="mt-6 max-w-[440px] text-[15px] leading-relaxed text-ink-2">
              Tell us where your customers are and roughly what you ship. We will come back with a
              proposed fulfilment-centre split, an indicative monthly cost, and what onboarding
              would look like.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {[
                "A response within one working day",
                "Costed proposal, not a brochure",
                "No obligation and no lock-in on the first term",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-ink-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <WarehousingLeadForm />
        </div>
      </Section>

      <CtaBand
        lead="Every day stock sits in the wrong city is"
        strong="a delivery promise you cannot make"
        primaryLabel="Request a proposal"
        secondaryLabel="Track a consignment"
        secondaryHref="/track"
      />
    </>
  );
}
