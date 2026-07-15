import { cn } from "@/lib/cn";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass rounded-2xl shadow-[0_8px_32px_rgb(0_0_0/0.35)]", className)}>
      {children}
    </div>
  );
}
