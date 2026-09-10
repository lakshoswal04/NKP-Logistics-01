"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/**
 * Slim inline tracking bar.
 *
 * Replaces the widget that used to float over the hero. Tracking is still one
 * field and one click from the home page — it just no longer dominates the
 * first screen, or borrow a competitor's layout to do it.
 */
export function TrackBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const id = useId();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query) router.push(`/track?id=${encodeURIComponent(query)}`);
      }}
      className="flex flex-col gap-4 rounded-2xl bg-void p-7 text-ink-inverse sm:flex-row sm:items-center sm:justify-between sm:p-9"
    >
      <div>
        <h2 className="font-display text-[22px] font-bold sm:text-[26px]">
          Already shipping with us?
        </h2>
        <p className="mt-2 text-[14px] text-ink-inverse-2">
          Track by AWB, order ID or LRN. No sign-in, and never an OTP.
        </p>
      </div>

      <div className="flex w-full gap-3 sm:w-auto">
        <label htmlFor={id} className="sr-only">
          Tracking reference
        </label>
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="NKP2026A1B2"
          autoComplete="off"
          className="w-full rounded-pill border border-line-inverse bg-transparent px-5 py-3 text-sm text-ink-inverse placeholder:text-ink-inverse-3 transition-colors focus:border-paper focus:outline-none sm:w-[260px]"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 rounded-pill bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent disabled:opacity-40"
        >
          Track
        </button>
      </div>
    </form>
  );
}
