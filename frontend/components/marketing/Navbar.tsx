"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/marketing/Logo";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/technology", label: "AI & Technology" },
  { href: "/track", label: "Track" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-base/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight">NKP Logistics</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm transition-colors",
                pathname === l.href ? "text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button href="/contact" className="px-5 py-2.5">
            Get a Quote
          </Button>
        </div>

        <button
          className="flex size-10 items-center justify-center rounded-lg text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-base px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-2 hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Button href="/contact" className="w-full" onClick={() => setOpen(false)}>
              Get a Quote
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
