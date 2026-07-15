export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{value}</span>
      <span className="text-sm text-ink-2">{label}</span>
    </div>
  );
}
