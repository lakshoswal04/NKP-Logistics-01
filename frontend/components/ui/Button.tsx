import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "glass text-ink hover:border-white/20",
  ghost: "text-ink-2 hover:text-ink",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

type ButtonProps = {
  variant?: Variant;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className" | "children" | "onClick">;

export function Button({ variant = "primary", href, className, children, onClick, ...rest }: ButtonProps) {
  const cls = cn(base, styles[variant], className);
  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
