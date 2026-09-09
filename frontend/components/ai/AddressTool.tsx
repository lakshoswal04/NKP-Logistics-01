"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Disclaimer, ModuleCard, RiskMeter, inputCls, labelCls } from "@/components/ai/Primitives";
import { Button } from "@/components/ui/Button";
import { analyseAddress } from "@/lib/aiApi";

const EXAMPLES = [
  { label: "Complete", value: "Flat 402, Sunrise Apartments, Marol Naka, Andheri East, Mumbai 400093. Ph 9820012345" },
  { label: "Vague", value: "near the big temple, opposite the school, second lane" },
  { label: "Conflicting", value: "Shop 7, MG Road, Pune 400093" },
];

export function AddressTool({ index }: { index: number }) {
  const [address, setAddress] = useState(EXAMPLES[0].value);
  const mutation = useMutation({ mutationFn: analyseAddress });
  const result = mutation.data;

  return (
    <ModuleCard
      index={index}
      title="Address Intelligence"
      tagline="Indian addresses are written for humans who already know the area. This normalises one and scores how likely a delivery attempt is to fail."
      mode={result?.mode}
      model={result?.model}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(address);
        }}
      >
        <label htmlFor="addr" className={labelCls}>
          Raw delivery address
        </label>
        <textarea
          id="addr"
          rows={3}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className={`${inputCls} resize-y`}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-ink-3">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => setAddress(example.value)}
              className="border border-line-strong px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
            >
              {example.label}
            </button>
          ))}
        </div>
        <Button type="submit" className="mt-4" disabled={mutation.isPending || address.trim().length < 6}>
          {mutation.isPending ? "Scoring…" : "Score this address"}
        </Button>
      </form>

      {mutation.isError && (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          Could not score that address. Please try again.
        </p>
      )}

      {result && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <RiskMeter value={result.rto_risk} band={result.risk_band} />
              <dl className="mt-5 flex flex-col gap-2 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Parse confidence</dt>
                  <dd className="font-semibold text-ink">{Math.round(result.confidence * 100)}%</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Serviceable</dt>
                  <dd className={result.serviceable ? "font-semibold text-success" : "font-semibold text-danger"}>
                    {result.serviceable ? "Yes" : "Not mapped"}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <p className="eyebrow mb-2">Normalised</p>
              <dl className="flex flex-col gap-1.5 text-[12.5px]">
                {Object.entries(result.normalised).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-line pb-1.5">
                    <dt className="capitalize text-ink-3">{key.replace(/_/g, " ")}</dt>
                    <dd className={value ? "text-right font-medium text-ink" : "text-ink-3"}>
                      {value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-2">What would go wrong</p>
            <ul className="flex flex-col gap-2">
              {result.issues.map((issue) => (
                <li key={issue} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 bg-brand" aria-hidden />
                  {issue}
                </li>
              ))}
            </ul>
          </div>

          <Disclaimer>{result.reasoning}</Disclaimer>
        </div>
      )}
    </ModuleCard>
  );
}
