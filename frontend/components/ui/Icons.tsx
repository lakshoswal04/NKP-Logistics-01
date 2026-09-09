/**
 * Line icons drawn on a 24×24 grid with a 1.5 stroke.
 *
 * Hand-rolled rather than pulled from an icon package: there are only a handful,
 * they need to match the squared-off geometry of the rest of the design, and an
 * icon dependency would be larger than the icons.
 */

type IconProps = { className?: string };

const base = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Racking / storage footprint that scales. */
export function IconRacking({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 21V5m18 16V5M3 5h18" />
      <path d="M3 11h18M3 16h18" />
      <path d="M7 5V3m10 2V3" />
    </svg>
  );
}

/** One system across many locations. */
export function IconNetwork({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="9.5" y="9.5" width="5" height="5" />
      <circle cx="4" cy="4" r="2" />
      <circle cx="20" cy="4" r="2" />
      <circle cx="4" cy="20" r="2" />
      <circle cx="20" cy="20" r="2" />
      <path d="M5.5 5.5 9.5 9.5m9-4-4 4m4 9-4-4m-9 4 4-4" />
    </svg>
  );
}

/** Auditable billing. */
export function IconInvoice({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

/** Inventory visibility down to the batch. */
export function IconVisibility({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5 20 6v6c0 4.6-3.2 8.5-8 9.5-4.8-1-8-4.9-8-9.5V6l8-3.5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export const ADVANTAGE_ICONS = [IconRacking, IconNetwork, IconInvoice, IconVisibility] as const;
