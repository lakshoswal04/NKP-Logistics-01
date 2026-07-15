import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NKP Logistics collects, uses and protects personal data under India's DPDP Act 2023.",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "1. Who we are",
    body: [
      "NKP Logistics Pvt Ltd (\"NKP\", \"we\") provides B2B logistics services across India. This policy explains how we handle personal data on our website, portals and operational systems, in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act).",
    ],
  },
  {
    heading: "2. Data we collect",
    body: [
      "Contact data you submit through our forms: name, email, phone number, company name and enquiry details.",
      "Shipment data required to perform deliveries: pickup and delivery addresses, consignee names and contact numbers.",
      "Account data for portal users: login credentials (passwords are stored only as salted hashes), role and activity logs.",
      "Technical data: IP address and basic device information for security and rate-limiting purposes.",
    ],
  },
  {
    heading: "3. Why we process it",
    body: [
      "To respond to enquiries and provide quotes you request.",
      "To perform the logistics services you or your company have contracted: booking, transportation, tracking, delivery and invoicing.",
      "To secure our platform, prevent fraud and meet legal obligations (e.g. e-way bill and tax requirements).",
    ],
  },
  {
    heading: "4. Consent and your rights",
    body: [
      "Where processing is based on consent, you may withdraw it at any time. Under the DPDP Act you have the right to access a summary of your personal data, request correction or erasure, nominate a representative, and raise a grievance.",
      "Requests can be sent to privacy@nkplogistics.in. We respond within the timelines prescribed by the Act.",
    ],
  },
  {
    heading: "5. Sharing",
    body: [
      "Shipment contact details are shared with assigned drivers and warehouse staff strictly to perform delivery. Driver-to-customer calls are routed through masked numbers; real phone numbers are not exposed on public tracking pages.",
      "We use third-party processors (cloud hosting, payment gateway, communication providers) bound by contractual data-protection obligations. We do not sell personal data.",
    ],
  },
  {
    heading: "6. Retention and security",
    body: [
      "Personal data is retained only as long as needed for the purposes above or as required by law (e.g. tax records), and is then deleted or anonymised.",
      "We apply industry-standard safeguards: encryption in transit, hashed credentials, role-based access control and audit logging of administrative actions.",
    ],
  },
  {
    heading: "7. Changes",
    body: [
      "We will post updates to this policy on this page. Material changes will be notified to account holders by email.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" text="Last updated: 16 July 2026" />
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.heading}>
              <h2 className="font-display text-xl font-semibold">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-2">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
