import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Flat bordered panel. Replaces the old glassmorphic card. */
export function Card({
  className,
  children,
  tone = "paper",
}: {
  className?: string;
  children: ReactNode;
  tone?: "paper" | "mist";
}) {
  return (
    <div
      className={cn(
        "border border-line",
        tone === "paper" ? "bg-white" : "bg-mist",
        className,
      )}
    >
      {children}
    </div>
  );
}
