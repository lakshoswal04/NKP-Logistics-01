export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="1" y="6" width="12" height="16" rx="2" fill="#2E5BFF" />
      <rect x="9" y="2" width="12" height="16" rx="2" fill="#2E5BFF" fillOpacity="0.55" />
      <rect x="16" y="9" width="11" height="13" rx="2" fill="#F5F5F7" fillOpacity="0.9" />
    </svg>
  );
}
