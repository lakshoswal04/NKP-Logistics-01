import Image from "next/image";

import { TrackWidget } from "@/components/site/TrackWidget";

const CHIPS = ["Warehousing", "Fulfilment", "Inventory", "Returns", "Distribution"] as const;

export function HomeHero() {
  return (
    <section className="relative bg-ink">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="relative min-h-[520px] overflow-hidden lg:min-h-[600px]">
          <Image
            src="/media/hero-racking.jpg"
            alt="High-bay racking inside an NKP fulfilment centre"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="hero-scrim absolute inset-0" aria-hidden />

          <div className="relative mx-auto flex min-h-[520px] max-w-[1200px] items-center px-6 lg:min-h-[600px]">
            <div className="max-w-[620px] py-16 animate-fade-up">
              <h1 className="font-display text-[34px] font-semibold leading-[1.12] text-white sm:text-[44px] lg:text-[52px]">
                India&rsquo;s inventory needs a{" "}
                <em className="font-bold not-italic text-brand">better address</em>
              </h1>
              <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                42 multi-client fulfilment centres, one warehouse management system, and stock held
                close enough to your customers that next-day stops being a premium.
              </p>

              <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
                {CHIPS.map((chip, index) => (
                  <li key={chip} className="flex items-center gap-3">
                    {index > 0 && <span className="chip-sep" aria-hidden />}
                    <span className="text-[14px] font-medium text-white/90">{chip}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 h-11 w-11 bg-brand" aria-hidden />
            </div>
          </div>

          {/* The widget overlaps the photograph on desktop; below lg it drops
              beneath the image so it never covers the headline. */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-end lg:flex">
            <div className="mx-auto flex w-full max-w-[1200px] justify-end px-6">
              <TrackWidget className="pointer-events-auto translate-y-6" />
            </div>
          </div>
        </div>

        <div className="bg-ink px-6 pb-12 lg:hidden">
          <TrackWidget className="mx-auto -translate-y-8" />
        </div>
      </div>
    </section>
  );
}
