import Link from "next/link";

import { LogoMark } from "@/components/site/Logo";
import { NetworkMap } from "@/components/site/NetworkMap";
import { COMPANY, FOOTER_COLUMNS } from "@/lib/content";

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    path: "M4.98 3.5a2 2 0 1 1-.02 4 2 2 0 0 1 .02-4ZM3.5 8.9h3v11.6h-3V8.9Zm5.2 0h2.87v1.59h.04a3.15 3.15 0 0 1 2.83-1.56c3.03 0 3.59 2 3.59 4.58v6h-3v-5.32c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81v5.41h-3V8.9Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    path: "M12 2.9c2.96 0 3.31.01 4.48.06 1.08.05 1.67.23 2.06.38.52.2.89.44 1.28.83.39.39.63.76.83 1.28.15.39.33.98.38 2.06.05 1.17.06 1.52.06 4.48s-.01 3.31-.06 4.48c-.05 1.08-.23 1.67-.38 2.06-.2.52-.44.89-.83 1.28-.39.39-.76.63-1.28.83-.39.15-.98.33-2.06.38-1.17.05-1.52.06-4.48.06s-3.31-.01-4.48-.06c-1.08-.05-1.67-.23-2.06-.38a3.5 3.5 0 0 1-1.28-.83 3.5 3.5 0 0 1-.83-1.28c-.15-.39-.33-.98-.38-2.06C2.91 15.31 2.9 14.96 2.9 12s.01-3.31.06-4.48c.05-1.08.23-1.67.38-2.06.2-.52.44-.89.83-1.28.39-.39.76-.63 1.28-.83.39-.15.98-.33 2.06-.38C8.69 2.91 9.04 2.9 12 2.9Zm0 4.6a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 7.42a2.92 2.92 0 1 1 0-5.84 2.92 2.92 0 0 1 0 5.84Zm5.73-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z",
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-void text-ink-inverse">
      <div className="mx-auto max-w-[1240px] px-6 py-20">
        <div className="grid gap-16 lg:grid-cols-[1fr_460px]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={38} />
              <span className="font-display text-[18px] font-bold uppercase tracking-[0.04em]">
                <span className="text-accent-on-dark">NKP</span> Logistics
              </span>
            </div>
            <p className="mt-6 max-w-[380px] text-[14px] leading-relaxed text-ink-inverse-2">
              Multi-client warehousing and order fulfilment across 42 Indian fulfilment centres —
              storage, pick-pack, inventory control, returns and outbound distribution.
            </p>

            <h3 className="mt-12 text-[15px] font-semibold">Follow us</h3>
            <ul className="mt-4 flex gap-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="grid size-11 place-items-center rounded-full border border-line-inverse text-ink-inverse-2 transition-colors hover:border-paper hover:text-ink-inverse"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-6 text-accent-on-dark">Our network</p>
            <NetworkMap className="mx-auto max-w-[380px]" />
          </div>
        </div>

        <div className="mt-20 grid gap-10 border-t border-line-inverse pt-14 sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow mb-5 text-ink-inverse-3">{column.heading}</h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-ink-inverse-2 transition-colors hover:text-accent-on-dark"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-line-inverse pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-[11.5px] leading-relaxed text-ink-inverse-3">
            <p className="font-semibold text-ink-inverse-2">{COMPANY.legalName}</p>
            <p>ISO 9001:2015 · ISO 27001:2022 certified</p>
            <p>
              GSTIN {COMPANY.gstin} · CIN {COMPANY.cin}
            </p>
          </div>
          <div className="text-[11.5px] leading-relaxed text-ink-inverse-3 sm:text-right">
            <p>{COMPANY.hq}</p>
            <p>
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-accent-on-dark">
                {COMPANY.phone}
              </a>{" "}
              ·{" "}
              <a href={`mailto:${COMPANY.email}`} className="hover:text-accent-on-dark">
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-line-inverse pt-6">
          <p className="max-w-3xl text-[11px] leading-relaxed text-ink-inverse-3">
            <span className="font-semibold text-ink-inverse-2">Fraud advisory.</span> NKP Logistics
            never asks for an OTP, UPI PIN or card details to release a consignment, and never
            shares payment links over SMS or WhatsApp. Invoices are issued only from{" "}
            {COMPANY.email.replace("hello", "billing")} with a signed PDF attached. Report anything
            suspicious to {COMPANY.supportEmail}.
          </p>
          <p className="mt-5 text-[11.5px] text-ink-inverse-3">
            © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
