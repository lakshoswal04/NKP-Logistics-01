/**
 * Stylized shipping-container-on-crane visual for the Home hero — pure SVG,
 * matching the dark industrial reference art direction. Swappable for a real
 * 3D render later without touching the hero layout.
 */
export function ContainerVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 420" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="containerFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E6BFF" />
          <stop offset="55%" stopColor="#1E3FBF" />
          <stop offset="100%" stopColor="#12266F" />
        </linearGradient>
        <linearGradient id="containerSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A4CD9" />
          <stop offset="100%" stopColor="#0D1B4E" />
        </linearGradient>
        <linearGradient id="containerTop" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5F86FF" />
          <stop offset="100%" stopColor="#2E5BFF" />
        </linearGradient>
        <linearGradient id="spreader" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4B942" />
          <stop offset="100%" stopColor="#B7821B" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#2E5BFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2E5BFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="320" cy="230" rx="300" ry="170" fill="url(#glow)" />

      {/* crane cables */}
      <g stroke="#8B8B95" strokeWidth="1.5">
        <line x1="250" y1="0" x2="238" y2="118" />
        <line x1="390" y1="0" x2="402" y2="118" />
        <line x1="290" y1="0" x2="286" y2="112" />
        <line x1="350" y1="0" x2="354" y2="112" />
      </g>

      {/* spreader bar */}
      <g>
        <rect x="222" y="104" width="196" height="26" rx="4" fill="url(#spreader)" />
        <rect x="222" y="104" width="196" height="8" rx="4" fill="#FFD37A" fillOpacity="0.55" />
        <rect x="236" y="130" width="10" height="14" fill="#8A6414" />
        <rect x="394" y="130" width="10" height="14" fill="#8A6414" />
      </g>

      {/* container hoist cables */}
      <g stroke="#9A9AA5" strokeWidth="1.5">
        <line x1="241" y1="144" x2="180" y2="196" />
        <line x1="399" y1="144" x2="500" y2="188" />
        <line x1="270" y1="144" x2="250" y2="196" />
        <line x1="370" y1="144" x2="430" y2="188" />
      </g>

      {/* container: isometric-ish box */}
      <g>
        {/* top */}
        <polygon points="150,196 470,188 560,236 240,248" fill="url(#containerTop)" />
        {/* front face with corrugation */}
        <polygon points="150,196 240,248 240,388 150,336" fill="url(#containerSide)" />
        {/* long side */}
        <polygon points="240,248 560,236 560,372 240,388" fill="url(#containerFace)" />
        {/* corrugation ridges on long side */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1={262 + i * 21}
            y1={246.5 - i * 0.8}
            x2={262 + i * 21}
            y2={385 - i * 1.1}
            stroke="#0A1743"
            strokeOpacity="0.45"
            strokeWidth="5"
          />
        ))}
        {/* door details on front face */}
        <line x1="195" y1="222" x2="195" y2="362" stroke="#0A1743" strokeOpacity="0.6" strokeWidth="3" />
        <rect x="163" y="250" width="8" height="60" rx="3" fill="#0A1743" fillOpacity="0.5" />
        <rect x="215" y="256" width="8" height="60" rx="3" fill="#0A1743" fillOpacity="0.5" />
        {/* brand mark on side */}
        <text
          x="392"
          y="322"
          fill="#F5F5F7"
          fillOpacity="0.85"
          fontSize="30"
          fontWeight="700"
          fontFamily="var(--font-clash), sans-serif"
          textAnchor="middle"
        >
          NKP
        </text>
      </g>

      {/* ground shadow */}
      <ellipse cx="360" cy="404" rx="230" ry="14" fill="#000" fillOpacity="0.5" />
    </svg>
  );
}
