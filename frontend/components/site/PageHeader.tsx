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
    <header className={cn("bg-ink", className)}>
      <div className="mx-auto max-w-[1200px] px-6 py-14 lg:py-20">
        {eyebrow && <p className="eyebrow mb-4 text-white/50">{eyebrow}</p>}
        <h1 className="rule-red max-w-[760px] font-display text-[30px] font-bold leading-[1.15] text-white sm:text-[38px] lg:text-[44px]">
          {title}
        </h1>
        {text && (
          <p className="mt-6 max-w-[620px] text-[15px] leading-relaxed text-white/70">{text}</p>
        )}
      </div>
    </header>
  );
}
