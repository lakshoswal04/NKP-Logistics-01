import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/site/PageHeader";
import { TrackingView } from "@/components/tracking/TrackingView";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SUPPORT_CATEGORIES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Track a consignment",
  description:
    "Track an NKP consignment by AWB, order ID or LRN. No sign-in and no OTP required.",
};

const TRACK_FAQS = SUPPORT_CATEGORIES.find((c) => c.slug === "shipments")!.topics;

export default function TrackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Track"
        title="Where is my consignment?"
        text="Enter an AWB, order ID or lorry receipt number. Tracking is public — we will never ask you for an OTP, a UPI PIN or card details to show it."
      />

      <Section tone="paper">
        <Suspense fallback={<p className="text-[14px] text-ink-3">Loading…</p>}>
          <TrackingView />
        </Suspense>
      </Section>

      <Section tone="mist">
        <Reveal>
          <SectionHeading title="Frequently asked" />
        </Reveal>
        <RevealGroup className="mt-10 grid max-w-[900px] gap-3" gap={0.05}>
          {TRACK_FAQS.map((faq) => (
            <RevealItem key={faq.q}>
            <details
              className="group overflow-hidden rounded-xl bg-mist"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-[14.5px] font-semibold text-ink">
                {faq.q}
                <span
                  className="shrink-0 text-[20px] font-normal text-accent-ink transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="border-t border-line px-6 pb-5 text-[13.5px] leading-relaxed text-ink-2">
                {faq.a}
              </p>
            </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </>
  );
}
