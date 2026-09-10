import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { RaiseQueryForm } from "@/components/site/RaiseQueryForm";
import { SupportCentre } from "@/components/site/SupportCentre";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { COMPANY } from "@/lib/content";

export const metadata: Metadata = {
  title: "Support centre",
  description:
    "Answers on shipments, inventory, billing and onboarding — and a form to raise a query " +
    "with the NKP support desk. No sign-in required.",
};

export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="How can we help you today?"
        text="Search the answers below, or raise a query and we'll route it to the right desk. You'll get a reference by email straight away."
      />

      <Section tone="paper">
        <SupportCentre />
      </Section>

      <Section tone="mist" id="raise">
        <div className="grid gap-10 lg:grid-cols-[1fr_600px]">
          <Reveal>
            <SectionHeading title="Still stuck? Raise a query" />
            <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-ink-2">
              Tell us what happened and we&rsquo;ll pick it up. Include an AWB or invoice number
              where you have one — it saves a round trip.
            </p>

            <dl className="mt-9 flex flex-col gap-5 border-t border-line pt-7">
              <div>
                <dt className="eyebrow">Support desk</dt>
                <dd className="mt-1.5 text-[14px] text-ink-2">
                  <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-accent-ink">
                    {COMPANY.supportEmail}
                  </a>
                  <br />
                  <a
                    href={`tel:${COMPANY.supportPhone.replace(/\s/g, "")}`}
                    className="hover:text-accent-ink"
                  >
                    {COMPANY.supportPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Hours</dt>
                <dd className="mt-1.5 text-[14px] text-ink-2">
                  Monday to Saturday, 9:00 am – 7:00 pm IST
                </dd>
              </div>
            </dl>

            <div
              id="fraud"
              className="mt-9 rounded-xl border-l-2 border-accent bg-accent-soft p-6"
            >
              <h3 className="text-[13.5px] font-bold text-ink">Fraud advisory</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                We never ask for an OTP, UPI PIN or card details to release a consignment, and we
                never send payment links over SMS or WhatsApp. Our support team is reachable only
                through this website. If someone contacts you claiming otherwise, report it to{" "}
                <a href={`mailto:${COMPANY.supportEmail}`} className="font-semibold underline">
                  {COMPANY.supportEmail}
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <RaiseQueryForm />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
