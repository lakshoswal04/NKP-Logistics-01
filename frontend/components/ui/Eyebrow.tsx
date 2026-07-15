import { cn } from "@/lib/cn";

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("eyebrow flex items-center gap-2", className)}>
      <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden />
      {children}
    </p>
  );
}
