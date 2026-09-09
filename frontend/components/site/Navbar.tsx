"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Warehousing", href: "/services/warehousing" },
  { label: "AI Control Tower", href: "/ai" },
  { label: "Track", href: "/track" },
  { label: "Support", href: "/support" },
  { label: "Contact", href: "/contact" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The drawer closes on link click rather than in an effect keyed on pathname:
  // setState inside an effect body triggers a second render pass, and the click
  // is the actual event we care about.
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-ink">
      <nav className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        <Link href="/" aria-label={`${"NKP Logistics"} home`}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[14px] font-medium transition-colors",
                    active ? "text-white" : "text-white/75 hover:text-white",
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-brand" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-[14px] font-medium text-white/75 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="rounded-[3px] bg-white px-5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-mist"
          >
            Get a quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 p-2 text-white lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-white/10 bg-ink px-6 py-4 lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block border-b border-white/10 py-3 text-[15px] text-white/85"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" onClick={close} className="block py-3 text-[15px] text-white/85">
                Sign in
              </Link>
            </li>
          </ul>
          <Link
            href="/contact"
            onClick={close}
            className="mt-3 block rounded-[3px] bg-brand px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Get a quote
          </Link>
        </div>
      )}
    </header>
  );
}
