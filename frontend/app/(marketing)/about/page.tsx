import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { STATS } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description: "NKP Logistics — a technology-first logistics partner for Indian businesses.",
};

const BLOCKS = [
  {
    title: "Mission",
    text: "Make enterprise-grade logistics — live tracking, predictable delivery, transparent pricing — available to every Indian business, not just the largest ones.",
  },
  {
    title: "Vision",
    text: "A logistics network where every truck, warehouse and delivery is connected to one intelligent system, and 'where is my shipment?' is a question nobody needs to ask.",
  },
  {
    title: "Values",
    text: "Reliability before growth. Transparency before convenience. Technology in service of operations, never the other way around.",
  },
  {
    title: "Journey",
    text: "Started on a handful of west-India lanes, now moving freight across 220+ cities with a platform built in-house — and an AI layer that gets smarter with every shipment.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A logistics company that behaves like a technology company"
        text="We built our own platform because spreadsheets and phone calls don't scale — and neither does your patience for them."
      />

      <section className="mx-auto max-w-7xl px-6 pb-4">
        <div className="grid gap-6 md:grid-cols-2">
          {BLOCKS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.05}>
              <GlassCard className="h-full p-8">
                <h2 className="font-display text-xl font-semibold text-accent">{b.title}</h2>
                <p className="mt-3 leading-relaxed text-ink-2">{b.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface/60 mt-16">
        <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} />
          ))}
        </Reveal>
      </section>

      <CtaBand title="Partner with us" cta="Partner With Us" />
    </>
  );
}
