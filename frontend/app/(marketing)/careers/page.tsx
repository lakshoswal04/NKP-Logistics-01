import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { CareersBoard } from "@/components/marketing/CareersBoard";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at NKP Logistics across operations, technology, sales and warehousing.",
};

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Help move India's freight forward"
        text="We hire people who like real-world problems: trucks, warehouses, deadlines — and the software that keeps them honest."
      />
      <CareersBoard />
    </>
  );
}
