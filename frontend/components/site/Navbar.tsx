"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Logo } from "@/components/site/Logo";
import { getAccessToken, logout } from "@/lib/auth";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Warehousing", href: "/services/warehousing" },
  { label: "AI Control Tower", href: "/ai" },
  { label: "Track", href: "/track" },
  { label: "Support", href: "/support" },
  { label: "Contact", href: "/contact" },
] as const;

const noopSubscribe = () => () => {};

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // useSyncExternalStore rather than reading localStorage during render: the
  // server render has no token, and reading it directly would hydrate mismatched.
  const token = useSyncExternalStore(noopSubscribe, getAccessToken, () => null);

  // The bar is transparent over the hero photograph and picks up a blurred dark
  // ground once it has scrolled past it. `passive` because the handler never
  // calls preventDefault, and the browser can then keep scrolling off the main
  // thread.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The drawer closes on link click rather than in an effect keyed on pathname:
  // setState inside an effect body triggers a second render pass, and the click
  // is the actual event we care about.
  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled || open ? "glass-nav" : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-6">
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
                    active ? "text-ink-inverse" : "text-ink-inverse-2 hover:text-ink-inverse",
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-brand" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {token ? (
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.assign("/");
              }}
              className="text-[14px] font-medium text-ink-inverse-2 transition-colors hover:text-ink-inverse"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-[14px] font-medium text-ink-inverse-2 transition-colors hover:text-ink-inverse"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/contact"
            className="rounded-pill border border-line-inverse-strong px-5 py-2.5 text-[13.5px] font-semibold text-ink-inverse transition-colors hover:border-paper hover:bg-paper hover:text-ink"
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
          className="-mr-2 p-2 text-ink-inverse lg:hidden"
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
        <div id="mobile-nav" className="border-t border-line-inverse bg-void px-6 py-4 lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block border-b border-line-inverse py-3 text-[15px] text-ink-inverse-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {token ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.assign("/");
                  }}
                  className="block w-full py-3 text-left text-[15px] text-ink-inverse-2"
                >
                  Sign out
                </button>
              ) : (
                <Link href="/login" onClick={close} className="block py-3 text-[15px] text-ink-inverse-2">
                  Sign in
                </Link>
              )}
            </li>
          </ul>
          <Link
            href="/contact"
            onClick={close}
            className="mt-3 block rounded-pill bg-brand px-5 py-3 text-center text-sm font-semibold text-paper"
          >
            Get a quote
          </Link>
        </div>
      )}
    </header>
  );
}
