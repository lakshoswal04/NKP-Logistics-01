import Image from "next/image";

import { cn } from "@/lib/cn";

/**
 * Photograph sitting proud of an offset black plate, with a small red square.
 *
 * The wrapper carries the padding so the plate can fill the bottom-right and
 * still show past the image on two edges — anchoring the plate behind an image
 * of the same size just hides it entirely.
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
    <div className={cn("relative lg:pb-7 lg:pr-7", className)}>
      <div
        className="absolute bottom-0 right-0 hidden h-[78%] w-[78%] bg-ink lg:block"
        aria-hidden
      />
      <div className={cn("relative overflow-hidden", aspect)}>
        <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      </div>
      <div className="absolute -top-3 right-3 hidden h-9 w-9 bg-brand lg:block" aria-hidden />
    </div>
  );
}
