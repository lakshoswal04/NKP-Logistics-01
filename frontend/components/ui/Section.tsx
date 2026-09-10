import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "paper" | "mist" | "ink" | "void" | "accent";

const TONES: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  mist: "bg-mist text-ink",
  ink: "bg-ink text-ink-inverse",
  void: "bg-void text-ink-inverse",
  // Black on the accent, as the reference does. Measured: black on this orange
  // is 7.23:1, white is 2.57:1 and fails. (The red this replaced was the other
  // way round, which is why the band's text colour flips with the accent.)
  accent: "bg-accent text-ink",
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
 * One weight, one colour, set large. The previous two-weight treatment (a light
 * phrase followed by a bold one) and the short rule beneath were both lifted
 * from a different design language and were the main reason the page kept
 * reading as that brand. An `Eyebrow` above the heading now carries the label.
 */
export function SectionHeading({
  title,
  inverse = false,
  className,
  as: Tag = "h2",
}: {
  title: string;
  inverse?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "max-w-[18ch] text-[34px] font-bold leading-[1.02] tracking-[-0.035em]",
        "sm:text-[44px] lg:text-[54px]",
        inverse ? "text-ink-inverse" : "text-ink",
        className,
      )}
    >
      {title}
    </Tag>
  );
}

export function Eyebrow({
  children,
  className,
  tone = "accent",
}: {
  children: ReactNode;
  className?: string;
  tone?: "accent" | "muted" | "inverse";
}) {
  return (
    <p
      className={cn(
        "eyebrow mb-5",
        tone === "accent" && "text-accent-ink",
        tone === "muted" && "text-ink-3",
        tone === "inverse" && "text-ink-inverse-3",
        className,
      )}
    >
      {children}
    </p>
  );
}
