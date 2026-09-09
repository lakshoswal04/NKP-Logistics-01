import { ALERTS } from "@/lib/content";

/**
 * Rolling advisory strip beneath the navbar.
 *
 * The list is rendered twice inside the track so the -50% keyframe loops
 * seamlessly; `aria-hidden` on the duplicate keeps screen readers from
 * announcing every advisory twice.
 */
export function AlertTicker() {
  return (
    <div className="relative overflow-hidden border-b border-brand/30 bg-brand-soft">
      <div className="flex w-max animate-ticker motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 || undefined}
          >
            <li className="flex items-center py-2 pl-6 pr-3">
              <span className="eyebrow text-brand">Advisory</span>
            </li>
            {ALERTS.map((alert) => (
              <li key={alert} className="flex items-center gap-4 py-2 pr-4">
                <span className="chip-sep shrink-0" />
                <span className="whitespace-nowrap text-[12.5px] text-ink-2">{alert}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
