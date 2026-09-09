import { Button } from "@/components/ui/Button";

export function CtaBand({
  lead = "Ready to stop guessing where your",
  strong = "stock actually is?",
  text = "Tell us your SKU count, order volume and where your customers are. We will model the fulfilment-centre split and come back with a costed proposal.",
  primaryLabel = "Talk to our team",
  primaryHref = "/contact",
  secondaryLabel = "Explore warehousing",
  secondaryHref = "/services/warehousing",
}: {
  lead?: string;
  strong?: string;
  text?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-ink py-band lg:py-band-lg">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h2 className="mx-auto max-w-[720px] font-display text-[28px] leading-[1.2] text-white sm:text-[34px] lg:text-[38px]">
          <span className="font-normal">{lead} </span>
          <span className="font-bold">{strong}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[600px] text-[15px] leading-relaxed text-white/70">
          {text}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={primaryHref} variant="light" size="lg" withArrow>
            {primaryLabel}
          </Button>
          <Button
            href={secondaryHref}
            size="lg"
            withArrow
            className="border border-white/25 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink"
          >
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
