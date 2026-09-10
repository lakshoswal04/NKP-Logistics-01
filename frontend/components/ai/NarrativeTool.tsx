"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Disclaimer, ModuleCard, inputCls, labelCls } from "@/components/ai/Primitives";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { delayNarrative, fetchDelayedConsignments } from "@/lib/aiApi";

export function NarrativeTool({ index }: { index: number }) {
  const [trackingId, setTrackingId] = useState("NKP2026J9K1");
  const [copied, setCopied] = useState(false);

  const { data: refs } = useQuery({
    queryKey: ["delayed-consignments"],
    queryFn: fetchDelayedConsignments,
    staleTime: 60_000,
  });

  const mutation = useMutation({ mutationFn: delayNarrative });
  const result = mutation.data;

  return (
    <ModuleCard
      index={index}
      title="Delay Narrative"
      tagline="Turn a scan history into something a customer can act on — a plain explanation, what happens next, and a ready-to-send email."
      mode={result?.mode}
      model={result?.model}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setCopied(false);
          mutation.mutate(trackingId);
        }}
      >
        <label htmlFor="narr" className={labelCls}>
          Consignment reference
        </label>
        <input
          id="narr"
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          className={inputCls}
        />
        {refs && refs.consignments.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-ink-3">Live now:</span>
            {refs.consignments.slice(0, 4).map((c) => (
              <button
                key={c.tracking_id}
                type="button"
                onClick={() => setTrackingId(c.tracking_id)}
                title={c.lane}
                className="border border-line-strong px-2.5 py-1 font-mono text-[11px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                {c.tracking_id}
              </button>
            ))}
          </div>
        )}
        <Button type="submit" className="mt-4" disabled={mutation.isPending || !trackingId.trim()}>
          {mutation.isPending ? "Drafting…" : "Draft the update"}
        </Button>
      </form>

      {mutation.isError && (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          No consignment with that reference.
        </p>
      )}

      {result && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="flex items-start justify-between gap-4">
            <h4 className="font-display text-[16px] font-bold leading-snug text-ink">
              {result.headline}
            </h4>
            <StatusPill status={result.status} />
          </div>

          <div className="mt-4 flex flex-col gap-3 text-[13.5px] leading-relaxed text-ink-2">
            <p>{result.explanation}</p>
            <p>
              <span className="font-semibold text-ink">Next: </span>
              {result.next_step}
            </p>
            <p className="text-[12.5px] text-ink-3">{result.revised_eta_note}</p>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="eyebrow">Customer email</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Subject: ${result.email_subject}\n\n${result.email_body}`,
                  );
                  setCopied(true);
                }}
                className="text-[11.5px] font-semibold text-accent-ink hover:text-accent-hover"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="border border-line bg-mist">
              <p className="border-b border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink">
                {result.email_subject}
              </p>
              <p className="whitespace-pre-line px-4 py-3.5 text-[13px] leading-relaxed text-ink-2">
                {result.email_body}
              </p>
            </div>
          </div>

          <Disclaimer>
            Drafted from the consignment&rsquo;s own scan history. No cause is asserted that the
            scans do not support.
          </Disclaimer>
        </div>
      )}
    </ModuleCard>
  );
}
