"use client";

import { useQuery } from "@tanstack/react-query";

import { AddressTool } from "@/components/ai/AddressTool";
import { Copilot } from "@/components/ai/Copilot";
import { NarrativeTool } from "@/components/ai/NarrativeTool";
import { PlacementTool } from "@/components/ai/PlacementTool";
import { ModeBadge } from "@/components/ai/Primitives";
import { TriageTool } from "@/components/ai/TriageTool";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { fetchAiStatus } from "@/lib/aiApi";

const FALLBACK_SUGGESTIONS = [
  "How many consignments are in transit right now?",
  "Which consignments are delayed?",
  "What is outstanding on receivables?",
  "Where is NKP2026A1B2?",
];

export function ControlTower() {
  const { data: status, isError } = useQuery({
    queryKey: ["ai-status"],
    queryFn: fetchAiStatus,
    staleTime: 300_000,
  });

  return (
    <>
      <Section tone="paper">
        <div className="flex flex-col gap-3 rounded-2xl bg-mist p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {status && <ModeBadge mode={status.mode} model={status.model} />}
            <p className="max-w-[720px] text-[13px] leading-relaxed text-ink-2">
              {isError
                ? "The AI service is not reachable. The tools below need the API running on port 8080."
                : (status?.note ??
                  "Checking which mode the control tower is running in…")}
            </p>
          </div>
        </div>

        <Reveal className="mt-12">
          <SectionHeading title="01 — Ops Copilot" />
          <p className="mt-5 max-w-[620px] text-[15px] leading-relaxed text-ink-2">
            Ask a question in plain English. The copilot calls real tools against your own
            consignments, invoices and receivables, and shows you which ones it used — so every
            figure on screen can be traced back to a query, not a guess.
          </p>
          <div className="mt-8">
            <Copilot suggestions={status?.suggestions ?? FALLBACK_SUGGESTIONS} />
          </div>
        </Reveal>
      </Section>

      <Section tone="mist">
        <SectionHeading title="Four tools that do specific, useful work" />
        <p className="mt-5 max-w-[620px] text-[15px] leading-relaxed text-ink-2">
          Open to everyone — no sign-in needed. Each one runs against live logic and tells you how
          it reached its answer.
        </p>
        <RevealGroup className="mt-10 grid gap-6 xl:grid-cols-2" gap={0.06}>
          <RevealItem><AddressTool index={2} /></RevealItem>
          <RevealItem><PlacementTool index={3} /></RevealItem>
          <RevealItem><TriageTool index={4} /></RevealItem>
          <RevealItem><NarrativeTool index={5} /></RevealItem>
        </RevealGroup>
      </Section>
    </>
  );
}
