import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { WarehousingLeadForm } from "@/components/site/WarehousingLeadForm";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { COMPANY, OFFICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to the NKP Logistics fulfilment team about warehousing, order fulfilment and " +
    "distribution. Offices in Mumbai, Bengaluru and Delhi NCR.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's talk about where your stock should sit"
        text="Tell us what you ship and where your customers are. We'll come back with a proposed fulfilment-centre split and an indicative monthly cost — not a brochure."
      />

      <Section tone="paper">
        <div className="grid gap-12 lg:grid-cols-[1fr_460px]">
          <div>
            <SectionHeading lead="Reach the" strong="right desk first time" />

            <dl className="mt-10 grid gap-8 sm:grid-cols-2">
              {[
                {
                  label: "New business",
                  value: COMPANY.salesEmail,
                  href: `mailto:${COMPANY.salesEmail}`,
                  note: "Warehousing, fulfilment and distribution enquiries",
                },
                {
                  label: "Existing customers",
                  value: COMPANY.supportEmail,
                  href: `mailto:${COMPANY.supportEmail}`,
                  note: "Shipments, inventory and billing — or raise a query",
                },
                {
                  label: "Switchboard",
                  value: COMPANY.phone,
                  href: `tel:${COMPANY.phone.replace(/\s/g, "")}`,
                  note: "Monday to Saturday, 9:00 am – 7:00 pm IST",
                },
                {
                  label: "General",
                  value: COMPANY.email,
                  href: `mailto:${COMPANY.email}`,
                  note: "Anything that does not fit the above",
                },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="eyebrow">{item.label}</dt>
                  <dd className="mt-2">
                    <a
                      href={item.href}
                      className="text-[15px] font-semibold text-ink transition-colors hover:text-brand"
                    >
                      {item.value}
                    </a>
                    <p className="mt-1 text-[12.5px] text-ink-3">{item.note}</p>
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-14 font-display text-[17px] font-bold text-ink">Offices</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {OFFICES.map((office, index) => (
                <Reveal key={office.city} delay={index * 0.05}>
                  <address className="h-full border border-line p-5 not-italic">
                    <span className="block h-[3px] w-8 bg-brand" aria-hidden />
                    <p className="mt-4 font-display text-[15px] font-bold text-ink">
                      {office.city}
                    </p>
                    <p className="text-[11.5px] uppercase tracking-wide text-ink-3">
                      {office.role}
                    </p>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
                      {office.address}
                    </p>
                    <a
                      href={`tel:${office.phone.replace(/\s/g, "")}`}
                      className="mt-2 inline-block text-[12.5px] text-ink-2 hover:text-brand"
                    >
                      {office.phone}
                    </a>
                  </address>
                </Reveal>
              ))}
            </div>

            <p className="mt-8 text-[12px] leading-relaxed text-ink-3">
              Registered office: {COMPANY.hq} · GSTIN {COMPANY.gstin} · CIN {COMPANY.cin}
            </p>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <WarehousingLeadForm />
          </div>
        </div>
      </Section>
    </>
  );
}
