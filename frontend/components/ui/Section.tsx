import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "paper" | "mist" | "ink" | "void" | "brand";

const TONES: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  mist: "bg-mist text-ink",
  ink: "bg-ink text-ink-inverse",
  void: "bg-void text-ink-inverse",
  // White on the accent, not black. The reference uses black on orange, but
  // orange is far lighter: black on OUR red measures 3.98:1, which fails AA for
  // body copy. White measures 4.67:1 and passes at both sizes.
  brand: "bg-brand text-paper",
};

/**
 * A full-bleed horizontal band with a centred content column.
 *
 * Pages are built by stacking these. The alternating grounds are what give the
 * layout its rhythm; nothing else should set a page-level background.
 */
export function Section({
  tone = "paper",
  className,
  innerClassName,
  id,
  children,
}: {
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn(TONES[tone], "py-band lg:py-band-lg", className)}>
      <div className={cn("mx-auto w-full max-w-[1240px] px-6", innerClassName)}>{children}</div>
    </section>
  );
}

/**
 * Section heading.
 *
 * `lead` renders in normal weight and `strong` in bold. The red rule underneath
 * is now opt-in (`rule`) — the reference sets an eyebrow above the heading
 * instead, and using both reads as clutter.
 */
export function SectionHeading({
  lead,
  strong,
  inverse = false,
  rule = false,
  className,
  as: Tag = "h2",
}: {
  lead?: string;
  strong: string;
  inverse?: boolean;
  rule?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-[34px] leading-[1.05] sm:text-[44px] lg:text-[52px]",
        rule && "rule-red",
        inverse ? "text-ink-inverse" : "text-ink",
        className,
      )}
    >
      {lead ? <span className="font-normal opacity-70">{lead} </span> : null}
      <span className="font-bold">{strong}</span>
    </Tag>
  );
}

export function Eyebrow({
  children,
  className,
  tone = "brand",
}: {
  children: ReactNode;
  className?: string;
  tone?: "brand" | "muted" | "inverse";
}) {
  return (
    <p
      className={cn(
        "eyebrow mb-5",
        tone === "brand" && "text-brand",
        tone === "muted" && "text-ink-3",
        tone === "inverse" && "text-ink-inverse-3",
        className,
      )}
    >
      {children}
    </p>
  );
}
