import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "paper" | "mist" | "void";

const TONES: Record<Tone, string> = {
  paper: "bg-paper border border-line",
  mist: "bg-mist border border-transparent",
  void: "bg-void-2 border border-line-inverse text-ink-inverse",
};

/** Rounded panel. The soft-grey variant carries no visible border, as in the reference. */
export function Card({
  className,
  children,
  tone = "paper",
}: {
  className?: string;
  children: ReactNode;
  tone?: Tone;
}) {
  return <div className={cn("rounded-2xl", TONES[tone], className)}>{children}</div>;
}
