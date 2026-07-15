import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/marketing/PageHeader";
import { TrackingView } from "@/components/tracking/TrackingView";

export const metadata: Metadata = {
  title: "Track Shipment",
  description: "Track any NKP Logistics shipment live with just a tracking ID — no login required.",
};

export default function TrackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Track shipment"
        title="Where's my shipment?"
        text="Enter your tracking ID to see live status, route progress and the full event timeline."
      />
      <Suspense>
        <TrackingView />
      </Suspense>
    </>
  );
}
