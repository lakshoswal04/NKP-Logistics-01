import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { LogoMark } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-mist px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <LogoMark size={34} />
        <span className="font-display text-[17px] font-bold uppercase tracking-[0.04em] text-ink">
          <span className="text-accent-ink">NKP</span> Logistics
        </span>
      </Link>

      <div className="w-full max-w-[420px] border border-line bg-white p-8">
        <Suspense fallback={<p className="text-[13.5px] text-ink-3">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <Link href="/" className="mt-8 text-[12.5px] text-ink-3 transition-colors hover:text-accent-ink">
        ← Back to the site
      </Link>
    </main>
  );
}
