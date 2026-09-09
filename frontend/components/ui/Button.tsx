import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "light" | "dark" | "brand" | "outline" | "outline-inverse" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // White pill on a dark ground — the hero's primary action.
  light: "bg-paper text-ink hover:bg-mist",
  // Black pill on a light ground — the same component inverted.
  dark: "bg-ink text-paper hover:bg-void",
  brand: "bg-brand text-paper hover:bg-brand-hover",
  outline: "border border-line-strong text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-inverse":
    "border border-line-inverse-strong text-paper hover:border-paper hover:bg-paper hover:text-ink",
  ghost: "text-ink hover:text-brand",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-6 py-3 text-[15px]",
};

// The badge sits inside the pill, so the pill needs less left padding than
// right to stay optically centred.
const BADGE_SIZES: Record<Size, string> = {
  sm: "pl-4 pr-1.5 py-1.5 text-[13px]",
  md: "pl-5 pr-2 py-2 text-[14px]",
  lg: "pl-6 pr-2.5 py-2.5 text-[15px]",
};

const BADGE_TONE: Record<Variant, string> = {
  light: "bg-ink text-paper",
  dark: "bg-paper text-ink",
  brand: "bg-paper text-brand",
  outline: "bg-ink text-paper",
  "outline-inverse": "bg-paper text-ink",
  ghost: "bg-ink text-paper",
};

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  /** Render the circular arrow badge inside the pill. */
  withBadge?: boolean;
  /** Render a plain inline arrow after the label. */
  withArrow?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

/**
 * Pill button.
 *
 * Fully rounded with an optional circular arrow badge — the signature control
 * of the design this site is modelled on. (An earlier iteration was
 * deliberately square-edged; that decision has been reversed along with the
 * rest of the visual direction.)
 */
export function Button({
  variant = "brand",
  size = "md",
  href,
  withBadge = false,
  withArrow = false,
  className,
  children,
  ...rest
}: Props) {
  const classes = cn(
    "group/btn inline-flex items-center justify-center gap-3 rounded-pill font-semibold",
    "transition-[background-color,border-color,color] duration-200",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    withBadge ? BADGE_SIZES[size] : SIZES[size],
    className,
  );

  const content = (
    <>
      <span>{children}</span>
      {withBadge && (
        <span
          aria-hidden
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full transition-transform duration-200",
            "group-hover/btn:translate-x-0.5",
            BADGE_TONE[variant],
          )}
        >
          <Arrow />
        </span>
      )}
      {withArrow && !withBadge && (
        <span aria-hidden className="transition-transform duration-200 group-hover/btn:translate-x-1">
          <Arrow wide />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {content}
    </button>
  );
}

function Arrow({ wide = false }: { wide?: boolean }) {
  return wide ? (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" aria-hidden>
      <path d="M0 4h16M13 1l3 3-3 3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 11L11 3M11 3H4.5M11 3v6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The recurring "Know more →" text link. */
export function ArrowLink({
  href,
  children,
  className,
  tone = "brand",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  tone?: "brand" | "ink" | "inverse";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/link inline-flex items-center gap-2 text-[13px] font-semibold transition-colors",
        tone === "brand" && "text-brand hover:text-brand-hover",
        tone === "ink" && "text-ink hover:text-brand",
        tone === "inverse" && "text-paper hover:text-brand",
        className,
      )}
    >
      {children}
      <span className="transition-transform duration-200 group-hover/link:translate-x-1">
        <Arrow wide />
      </span>
    </Link>
  );
}
