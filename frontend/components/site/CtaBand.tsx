import { Button } from "@/components/ui/Button";

export function CtaBand({
  title = "Ready to stop guessing where your stock actually is?",
  text = "Tell us your SKU count, order volume and where your customers are. We will model the fulfilment-centre split and come back with a costed proposal.",
  primaryLabel = "Talk to our team",
  primaryHref = "/contact",
  secondaryLabel = "Explore warehousing",
  secondaryHref = "/services/warehousing",
}: {
  title?: string;
  text?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-void py-band lg:py-band-lg">
      <div className="mx-auto max-w-[1240px] px-6 text-center">
        <h2 className="mx-auto max-w-[16ch] font-display text-[32px] font-bold leading-[1.03] tracking-[-0.035em] text-ink-inverse sm:text-[42px] lg:text-[50px]">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-[620px] text-[15.5px] leading-relaxed text-ink-inverse-2">
          {text}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={primaryHref} variant="light" size="lg" withBadge>
            {primaryLabel}
          </Button>
          <Button href={secondaryHref} variant="outline-inverse" size="lg" withArrow>
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
