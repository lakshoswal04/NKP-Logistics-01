import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms governing use of NKP Logistics services and platform.",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "1. Acceptance",
    body: [
      "By using the NKP Logistics website, portals or services, you agree to these Terms & Conditions. Services are offered to businesses; portal accounts are provided under the commercial agreement between NKP Logistics Pvt Ltd and your company.",
    ],
  },
  {
    heading: "2. Quotes and pricing",
    body: [
      "Instant quotes generated on this website are AI-estimated indicative ranges, not binding offers. Final pricing is confirmed by our team at booking and may vary with actual weight, dimensions, route conditions and applicable taxes.",
    ],
  },
  {
    heading: "3. Bookings and cancellations",
    body: [
      "Bookings are confirmed on written acceptance (including portal confirmation). Cancellation after vehicle placement may attract placement charges as per your rate agreement.",
    ],
  },
  {
    heading: "4. Consignor responsibilities",
    body: [
      "You are responsible for accurate shipment declarations (contents, weight, value), lawful goods, adequate packaging and required statutory documents (including e-way bills where applicable). Prohibited and hazardous goods require prior written approval.",
    ],
  },
  {
    heading: "5. Liability and insurance",
    body: [
      "Our liability for loss or damage is limited as per the applicable rate agreement and the Carriage of Goods by Road Act, 2007, unless transit insurance has been opted for at booking. Claims must be notified in writing within the period specified in your agreement.",
    ],
  },
  {
    heading: "6. Tracking data and platform use",
    body: [
      "Tracking information is provided for operational visibility and may lag real-world events. You agree not to scrape, overload or attempt to circumvent access controls on the platform. Personal data handling is described in our Privacy Policy and complies with the DPDP Act 2023.",
    ],
  },
  {
    heading: "7. Governing law",
    body: [
      "These terms are governed by the laws of India. Courts at Mumbai, Maharashtra shall have exclusive jurisdiction, subject to any arbitration clause in your commercial agreement.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" text="Last updated: 16 July 2026" />
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
