"use client";

import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

/**
 * Dotted map of India with the five NKP fulfilment centres marked.
 *
 * The outline is drawn as a dot grid masked by a coarse polygon of the
 * landmass — accurate enough to be recognisable at this size, and far lighter
 * than shipping a GeoJSON boundary and a projection library for what is a
 * decorative footer element. Coordinates are in the SVG's own 0–100 space,
 * eyeballed against a Mercator outline, not real lat/lng: nothing is measured
 * off this, so precision would be false rigour.
 */

const FCS = [
  { name: "Gurugram", x: 34, y: 27, side: "left" as const },
  { name: "Bhiwandi", x: 26, y: 57, side: "left" as const },
  { name: "Kolkata", x: 62, y: 47, side: "right" as const },
  { name: "Hoskote", x: 36, y: 77, side: "left" as const },
  { name: "Sriperumbudur", x: 44, y: 83, side: "right" as const },
];

// Coarse outline of the mainland, used to mask the dot grid.
const OUTLINE =
  // Kashmir and the northern border, east across the Gangetic plain…
  "M30,8 L36,12 L42,9 L48,14 L55,12 L61,17 L68,15 L74,21 L79,26 " +
  // …the north-east arm, then down the Bay of Bengal coast…
  "L75,31 L69,29 L66,34 L70,39 L64,43 L60,50 L56,59 L51,70 L46,82 L43,95 " +
  // …around the southern tip and back up the Arabian Sea coast…
  "L39,84 L35,72 L31,62 L26,54 L21,46 " +
  // …the Gujarat bulge and the north-west desert border.
  "L15,42 L13,34 L19,29 L23,19 Z";

export function NetworkMap({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  const dots: { x: number; y: number }[] = [];
  for (let y = 10; y <= 96; y += 2.6) {
    for (let x = 14; x <= 80; x += 2.6) {
      dots.push({ x, y });
    }
  }

  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 100 104" className="h-auto w-full" role="img"
           aria-label="Map of India showing NKP fulfilment centres at Gurugram, Bhiwandi, Kolkata, Hoskote and Sriperumbudur">
        <defs>
          <clipPath id="india-clip">
            <path d={OUTLINE} />
          </clipPath>
          <radialGradient id="pin-glow">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath="url(#india-clip)">
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r="0.62"
              fill="currentColor"
              className="text-ink-inverse/25"
            />
          ))}
        </g>

        {FCS.map((fc, i) => (
          <g key={fc.name}>
            <circle cx={fc.x} cy={fc.y} r="5" fill="url(#pin-glow)" />
            <circle cx={fc.x} cy={fc.y} r="1.5" fill="var(--color-brand)" />
            {!reduced && (
              <circle cx={fc.x} cy={fc.y} r="1.5" fill="none"
                      stroke="var(--color-brand)" strokeWidth="0.5" opacity="0.8">
                <animate attributeName="r" values="1.5;5.5" dur="2.8s"
                         begin={`${i * 0.55}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.8s"
                         begin={`${i * 0.55}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}
      </svg>

      {/* Labels are HTML rather than SVG <text> so they inherit the real type
          stack and stay legible when the map scales down. */}
      {FCS.map((fc) => (
        <span
          key={fc.name}
          style={{
            left: `${fc.x}%`,
            top: `${(fc.y / 104) * 100}%`,
            transform: fc.side === "left" ? "translate(-108%, -50%)" : "translate(8%, -50%)",
          }}
          className="pointer-events-none absolute whitespace-nowrap rounded-pill bg-paper px-2.5 py-1 text-[10.5px] font-semibold text-ink shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
        >
          {fc.name}
        </span>
      ))}
    </div>
  );
}
