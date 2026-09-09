import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "paper" | "mist" | "ink";

const TONES: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  mist: "bg-mist text-ink",
  ink: "bg-ink text-ink-inverse",
};

/**
 * A full-bleed horizontal band with a centred content column.
 *
 * The page is built by stacking these in alternating tones — that rhythm is
 * what makes the layout read as an operating company's site rather than one
 * long scrolling surface.
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
      <div className={cn("mx-auto w-full max-w-[1200px] px-6", innerClassName)}>{children}</div>
    </section>
  );
}

/**
 * Section heading with the signature red rule.
 *
 * `lead` renders in normal weight and `strong` in bold — the two-weight
 * heading is used on nearly every band.
 */
export function SectionHeading({
  lead,
  strong,
  inverse = false,
  className,
  as: Tag = "h2",
}: {
  lead?: string;
  strong: string;
  inverse?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "rule-red text-[28px] leading-[1.15] sm:text-[34px] lg:text-[40px]",
        inverse ? "text-ink-inverse" : "text-ink",
        className,
      )}
    >
      {lead ? <span className="font-normal">{lead} </span> : null}
      <span className="font-bold">{strong}</span>
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow mb-4", className)}>{children}</p>;
}
