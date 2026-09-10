"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Disclaimer, ModuleCard, inputCls, labelCls } from "@/components/ai/Primitives";
import { Button } from "@/components/ui/Button";
import { triageMessage } from "@/lib/aiApi";

const EXAMPLES = [
  {
    label: "Phishing report",
    value:
      "I got an SMS saying my delivery failed and asking me to pay ₹25 on a link to reschedule. Is this from you?",
  },
  {
    label: "Billing",
    value:
      "Our GSTIN is missing from the last invoice so our finance team cannot claim input credit. Can you reissue it?",
  },
  {
    label: "Inventory",
    value:
      "Our system shows 240 units of SKU KP-1180 but your dashboard shows 216. Where has the difference gone?",
  },
];

export function TriageTool({ index }: { index: number }) {
  const [message, setMessage] = useState(EXAMPLES[0].value);
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({ mutationFn: triageMessage });
  const result = mutation.data;

  return (
    <ModuleCard
      index={index}
      title="Support Triage"
      tagline="Classify an inbound query, summarise it for the desk, and draft the reply — grounded only in the published knowledge base, never invented."
      mode={result?.mode}
      model={result?.model}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setCopied(false);
          mutation.mutate(message);
        }}
      >
        <label htmlFor="triage" className={labelCls}>
          Customer message
        </label>
        <textarea
          id="triage"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={`${inputCls} resize-y`}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-ink-3">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => setMessage(example.value)}
              className="border border-line-strong px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
            >
              {example.label}
            </button>
          ))}
        </div>
        <Button type="submit" className="mt-4" disabled={mutation.isPending || message.trim().length < 10}>
          {mutation.isPending ? "Triaging…" : "Triage this"}
        </Button>
      </form>

      {result && (
        <div className="mt-6 border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[2px] bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              {result.category}
            </span>
            <span
              className={`rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                result.urgency === "high"
                  ? "bg-danger-soft text-danger"
                  : "bg-mist text-ink-2"
              }`}
            >
              {result.urgency} priority
            </span>
            {result.needs_human && (
              <span className="rounded-[2px] bg-warning-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning">
                Needs a human
              </span>
            )}
          </div>

          <div className="mt-5">
            <p className="eyebrow mb-1.5">One-line summary for the desk</p>
            <p className="text-[13.5px] leading-relaxed text-ink-2">{result.summary}</p>
          </div>

          {result.matched_topics.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow mb-1.5">Grounded in</p>
              <ul className="flex flex-col gap-1">
                {result.matched_topics.map((topic) => (
                  <li key={topic} className="text-[12.5px] text-ink-3">
                    · {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="eyebrow">Draft reply</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(result.suggested_reply);
                  setCopied(true);
                }}
                className="text-[11.5px] font-semibold text-accent-ink hover:text-accent-hover"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="whitespace-pre-line border border-line bg-mist p-4 text-[13px] leading-relaxed text-ink-2">
              {result.suggested_reply}
            </p>
          </div>

          <Disclaimer>
            A draft for an agent to review and send — never sent automatically.
          </Disclaimer>
        </div>
      )}
    </ModuleCard>
  );
}
