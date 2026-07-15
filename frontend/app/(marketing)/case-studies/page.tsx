import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { CASE_STUDIES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "How Indian businesses improved on-time delivery, cut freight costs and recovered working capital with NKP Logistics.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Case studies"
        title="Results our customers can measure"
        text="Client names withheld under NDA; numbers are theirs."
      />
      <section className="mx-auto max-w-7xl space-y-8 px-6 pb-8">
        {CASE_STUDIES.map((cs, i) => (
          <Reveal key={cs.slug} delay={i * 0.05}>
            <GlassCard className="grid gap-8 p-8 md:grid-cols-[1.6fr_1fr] md:p-10">
              <div>
                <Eyebrow>{cs.industry}</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-semibold">{cs.client}</h2>
                <div className="mt-6 space-y-5 text-sm leading-relaxed">
                  <div>
                    <h3 className="mb-1 font-semibold text-ink">Challenge</h3>
                    <p className="text-ink-2">{cs.challenge}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-ink">Solution</h3>
                    <p className="text-ink-2">{cs.solution}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-6 border-line md:border-l md:pl-8">
                {cs.results.map((r) => (
                  <div key={r.metric}>
                    <p className="font-display text-2xl font-semibold text-accent">{r.value}</p>
                    <p className="mt-1 text-sm text-ink-2">{r.metric}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </section>
      <CtaBand title="Want results like these?" />
    </>
  );
}
