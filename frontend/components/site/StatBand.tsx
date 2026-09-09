import { Reveal } from "@/components/ui/Reveal";
import { STATS } from "@/lib/content";

export function StatBand() {
  return (
    <section className="border-b border-line bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.05}>
              <div>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-[30px] font-bold leading-none text-ink lg:text-[36px]">
                    {stat.value}
                  </span>
                  <span className="mt-3 block h-[3px] w-9 bg-brand" aria-hidden />
                  <span className="mt-3 block max-w-[190px] text-[12.5px] leading-relaxed text-ink-2">
                    {stat.label}
                  </span>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
        <p className="mt-10 text-[11px] text-ink-3">Operational metrics as of August 2026.</p>
      </div>
    </section>
  );
}
