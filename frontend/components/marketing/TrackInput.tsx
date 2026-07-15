"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function TrackInput({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className={cn("flex w-full max-w-md gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) router.push(`/track?id=${encodeURIComponent(value.trim())}`);
      }}
    >
      <label htmlFor="hero-track" className="sr-only">
        Tracking ID
      </label>
      <input
        id="hero-track"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter tracking ID e.g. NKP2026A1B2"
        className="glass w-full rounded-[10px] px-4 py-3 text-sm text-ink placeholder:text-ink-3 focus:border-accent"
      />
      <button
        type="submit"
        className="shrink-0 rounded-[10px] bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Track
      </button>
    </form>
  );
}
