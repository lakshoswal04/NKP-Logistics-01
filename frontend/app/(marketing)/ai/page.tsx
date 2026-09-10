import type { Metadata } from "next";

import { ControlTower } from "@/components/ai/ControlTower";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "AI Control Tower",
  description:
    "An ops copilot with real access to your consignments and invoices, plus address " +
    "intelligence, fulfilment-centre placement, support triage and delay communications.",
};

export default function AiPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI Control Tower"
        title="Ask your warehouse a question, get a real answer"
        text="Not a chatbot bolted onto a marketing site. Five tools that read live data, show their working, and say plainly when they do not know."
      />

      <ControlTower />

      <CtaBand
        title="Want this pointed at your own inventory?"
        text="The control tower ships with every NKP account. Tell us what you shift and we will show you it running against your data."
        primaryLabel="Talk to our team"
        secondaryLabel="Explore warehousing"
      />
    </>
  );
}
