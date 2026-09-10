import { cn } from "@/lib/cn";

/** Compact masthead for interior pages that do not carry a photographic hero. */
export function PageHeader({
  eyebrow,
  title,
  text,
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  className?: string;
}) {
  return (
    <header className={cn("bg-void", className)}>
      <div className="mx-auto max-w-[1240px] px-6 pb-16 pt-32 lg:pb-24 lg:pt-40">
        {eyebrow && <p className="eyebrow mb-5 text-accent-on-dark">{eyebrow}</p>}
        <h1 className="max-w-[860px] font-display text-[36px] font-bold leading-[1.04] tracking-[-0.035em] text-ink-inverse sm:text-[46px] lg:text-[56px]">
          {title}
        </h1>
        {text && (
          <p className="mt-7 max-w-[640px] text-[16px] leading-relaxed text-ink-inverse-2">{text}</p>
        )}
      </div>
    </header>
  );
}
