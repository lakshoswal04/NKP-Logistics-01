import { Eyebrow } from "@/components/ui/Eyebrow";

export function PageHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-12 md:pt-40">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
        {title}
      </h1>
      {text && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{text}</p>}
    </div>
  );
}
