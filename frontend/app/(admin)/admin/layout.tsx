"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Logo } from "@/components/marketing/Logo";
import { getAccessToken, getSessionUser, logout } from "@/lib/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: "▦" },
  { href: "/admin/insights", label: "AI Insights", icon: "◈" },
];

const noopSubscribe = () => () => {};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Token as a stable external-store snapshot (null during SSR)
  const token = useSyncExternalStore(noopSubscribe, getAccessToken, () => null);
  const user = useMemo(() => (token ? getSessionUser() : null), [token]);
  const authorized = user !== null && (user.role === "admin" || user.role === "superadmin");

  useEffect(() => {
    // Effects only run on the client, where the token snapshot is real
    if (!authorized) router.replace("/login");
  }, [authorized, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-3">
        Checking session…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-line bg-surface px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <Logo size={24} />
          <span className="font-display text-base font-semibold">NKP Ops</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent/15 font-medium text-accent-hover"
                  : "text-ink-2 hover:bg-white/5 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="rounded-lg px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:bg-white/5 hover:text-ink"
        >
          Sign out
        </button>
      </aside>
      <main className="ml-56 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
