import Link from "next/link";

import { LogoMark } from "@/components/site/Logo";
import { COMPANY, FOOTER_COLUMNS } from "@/lib/content";

export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="eyebrow mb-5 text-ink">{column.heading}</h3>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-ink-2 transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <LogoMark size={34} />
            <div className="text-[11.5px] leading-relaxed text-ink-3">
              <p className="font-semibold text-ink-2">{COMPANY.legalName}</p>
              <p>ISO 9001:2015 · ISO 27001:2022 certified</p>
              <p>
                GSTIN {COMPANY.gstin} · CIN {COMPANY.cin}
              </p>
            </div>
          </div>
          <div className="text-[11.5px] leading-relaxed text-ink-3 sm:text-right">
            <p>{COMPANY.hq}</p>
            <p>
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-brand">
                {COMPANY.phone}
              </a>{" "}
              ·{" "}
              <a href={`mailto:${COMPANY.email}`} className="hover:text-brand">
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="max-w-3xl text-[11px] leading-relaxed text-ink-3">
            <span className="font-semibold text-ink-2">Fraud advisory.</span> NKP Logistics never
            asks for an OTP, UPI PIN or card details to release a consignment, and never shares
            payment links over SMS or WhatsApp. Invoices are issued only from{" "}
            {COMPANY.email.replace("hello", "billing")} with a signed PDF attached. Report anything
            suspicious to {COMPANY.supportEmail}.
          </p>
          <p className="mt-5 text-[11.5px] text-ink-3">
            © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
