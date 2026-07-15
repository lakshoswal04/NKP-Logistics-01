import type { Metadata } from "next";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ContactForm } from "@/components/contact/ContactForm";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact / Get a Quote",
  description: "Request a quote or talk to our logistics experts. Instant AI-estimated pricing on quotable lanes.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get a quote"
        text="Tell us what you're moving. Add a lane and weight and our AI quote engine will give you an indicative range instantly."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Suspense>
            <ContactForm />
          </Suspense>

          <div className="space-y-6">
            <GlassCard className="p-7">
              <p className="eyebrow mb-4">Reach us directly</p>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-ink-3">Phone · </span>
                  <a href={`tel:${COMPANY.phone.replaceAll(" ", "")}`} className="font-medium hover:text-accent-hover">
                    {COMPANY.phone}
                  </a>
                </p>
                <p>
                  <span className="text-ink-3">Email · </span>
                  <a href={`mailto:${COMPANY.email}`} className="font-medium hover:text-accent-hover">
                    {COMPANY.email}
                  </a>
                </p>
                <p>
                  <span className="text-ink-3">Office · </span>
                  <span className="font-medium">{COMPANY.address}</span>
                </p>
              </div>
            </GlassCard>
            <GlassCard className="relative flex min-h-56 items-center justify-center overflow-hidden p-7">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgb(46_91_255/0.18),transparent_65%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(rgb(255 255 255 / 0.06) 1.2px, transparent 1.2px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <p className="relative text-sm text-ink-3">Map view — Andheri East, Mumbai</p>
            </GlassCard>
          </div>
        </div>
      </section>
    </>
  );
}
