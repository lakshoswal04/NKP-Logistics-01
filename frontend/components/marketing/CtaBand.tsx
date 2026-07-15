import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CtaBand({
  title = "Need a custom logistics solution?",
  text = "Tell us about your lanes, volumes and constraints — we'll design the network around them.",
  cta = "Get a Free Consultation",
  href = "/contact",
}: {
  title?: string;
  text?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
          />
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-2">{text}</p>
          <div className="mt-8">
            <Button href={href}>{cta}</Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
