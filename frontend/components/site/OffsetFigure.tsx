import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Rounded photo card with a small accent marker.
 *
 * Previously this sat proud of an offset black plate. That device relied on the
 * plate contrasting with a white page; with dark bands either side it stopped
 * reading, so the figure is now a plain rounded card in the reference's style.
 */
export function OffsetFigure({
  src,
  alt,
  className,
  aspect = "aspect-[4/3]",
}: {
  src: string;
  alt: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div className={cn("group relative", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl", aspect)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div
        className="absolute -bottom-4 -left-4 hidden size-20 rounded-lg bg-brand lg:block"
        aria-hidden
      />
    </div>
  );
}
