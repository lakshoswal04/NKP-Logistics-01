import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "light" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  dark: "bg-ink text-white hover:bg-ink/85",
  light: "bg-white text-ink hover:bg-mist",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-white",
  ghost: "text-ink hover:text-brand",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-[15px]",
};

type Props = {
  variant?: Variant;
  size?: Size;
  href?: string;
  withArrow?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

/** Square-ish rather than pill — a freight brand should not look like a consumer app. */
export function Button({
  variant = "primary",
  size = "md",
  href,
  withArrow = false,
  className,
  children,
  ...rest
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2.5 rounded-[3px] font-semibold",
    "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      {children}
      {withArrow && <Arrow />}
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

function Arrow() {
  return (
    <svg width="18" height="8" viewBox="0 0 18 8" fill="none" aria-hidden>
      <path d="M0 4h16M13 1l3 3-3 3" stroke="currentColor" strokeWidth="1.4" />
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
        "group inline-flex items-center gap-2 text-[13px] font-semibold transition-colors",
        tone === "brand" && "text-brand hover:text-brand-hover",
        tone === "ink" && "text-ink hover:text-brand",
        tone === "inverse" && "text-white hover:text-brand",
        className,
      )}
    >
      {children}
      <span className="transition-transform duration-200 group-hover:translate-x-1">
        <Arrow />
      </span>
    </Link>
  );
}
