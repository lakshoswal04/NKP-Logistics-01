"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { cn } from "@/lib/cn";

const MODES = [
  { key: "awb", label: "AWB", hint: "e.g. NKP2026A1B2" },
  { key: "order", label: "Order ID", hint: "Your storefront order number" },
  { key: "lrn", label: "LRN", hint: "Lorry receipt number" },
] as const;

type Mode = (typeof MODES)[number]["key"];

/**
 * The white card that overlaps the hero photograph.
 *
 * There is deliberately no "Mobile" tab: on the site this is modelled after,
 * that tab is the OTP login path, and OTP is explicitly out of scope. All three
 * tabs here resolve to the same public lookup, which needs no authentication.
 */
export function TrackWidget({ className }: { className?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("awb");
  const [value, setValue] = useState("");
  const inputId = useId();

  const active = MODES.find((m) => m.key === mode)!;

  return (
    <div
      className={cn(
        // A dark drop shadow is invisible against the hero; the card is lifted
        // with a hairline and a soft ambient glow instead.
        "w-full rounded-xl border border-line-inverse bg-paper/[0.97] p-6 backdrop-blur-sm sm:p-7",
        "shadow-[0_28px_70px_-24px_rgb(0_0_0/0.7)]",
        className,
      )}
    >
      <div className="flex items-center gap-6 border-b border-line pb-3">
        <span className="relative pb-3 text-[15px] font-bold text-ink">
          Track order
          <span className="absolute inset-x-0 -bottom-[13px] h-[2.5px] rounded-full bg-accent" aria-hidden />
        </span>
        <a
          href="/contact"
          className="pb-3 text-[15px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          Get a quote
        </a>
      </div>

      <p className="mt-5 text-[19px] leading-snug text-ink">
        <span className="font-bold">Track</span> your consignment
      </p>

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          const id = value.trim();
          if (id) router.push(`/track?id=${encodeURIComponent(id)}`);
        }}
      >
        <div role="tablist" aria-label="Tracking reference type" className="grid grid-cols-3">
          {MODES.map((m) => {
            const selected = m.key === mode;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode(m.key)}
                className={cn(
                  "border px-3 py-2.5 text-[13px] font-semibold transition-colors first:rounded-l-sm last:rounded-r-sm",
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-line-strong bg-paper text-ink-3 hover:text-ink",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <label htmlFor={inputId} className="sr-only">
          {active.label}
        </label>
        <input
          id={inputId}
          name="tracking-id"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={active.hint}
          autoComplete="off"
          className="mt-3 w-full rounded-sm border border-line-strong px-4 py-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-ink focus:outline-none"
        />

        <button
          type="submit"
          className="mt-3 w-full rounded-pill bg-ink py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-40"
          disabled={!value.trim()}
        >
          Track
        </button>
      </form>

      <p className="mt-4 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-3">
        Tracking goes live once a consignment is manifested to the delivery partner. No sign-in
        needed — and we will never ask for an OTP to show it.
      </p>
    </div>
  );
}
