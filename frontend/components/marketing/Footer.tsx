import Link from "next/link";
import { COMPANY } from "@/lib/content";
import { Logo } from "@/components/marketing/Logo";

const COLUMNS = [
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: "/services", label: "All Services" },
      { href: "/solutions", label: "Industry Solutions" },
      { href: "/technology", label: "AI & Technology" },
      { href: "/track", label: "Track Shipment" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-semibold">NKP Logistics</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
            AI-powered B2B logistics across India — transportation, warehousing and last-mile,
            with live tracking on every shipment.
          </p>
          <div className="mt-4 space-y-1 text-sm text-ink-3">
            <p>{COMPANY.address}</p>
            <p>
              <a href={`tel:${COMPANY.phone.replaceAll(" ", "")}`} className="hover:text-ink-2">
                {COMPANY.phone}
              </a>
              {" · "}
              <a href={`mailto:${COMPANY.email}`} className="hover:text-ink-2">
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="eyebrow mb-4">{col.heading}</h3>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-3">
        © {new Date().getFullYear()} NKP Logistics Pvt Ltd. All rights reserved.
      </div>
    </footer>
  );
}
