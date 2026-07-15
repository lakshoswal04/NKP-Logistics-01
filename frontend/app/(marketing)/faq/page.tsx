import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHeader } from "@/components/marketing/PageHeader";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about booking, tracking, pricing, returns and accounts.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" />
      <section className="mx-auto max-w-3xl px-6 pb-8">
        {FAQS.map((group) => (
          <Reveal key={group.category} className="mb-10">
            <h2 className="eyebrow mb-4">{group.category}</h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <details key={item.q} className="glass group rounded-xl px-5 py-4 open:border-white/15">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden
                      className="text-ink-3 transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        ))}
      </section>
      <CtaBand title="Still have questions?" cta="Contact Us" />
    </>
  );
}
