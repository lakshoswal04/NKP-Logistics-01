import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the NKP Logistics platform.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-semibold">NKP Logistics</span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink-2">Operations, warehouse and customer portal access.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-3">
          Demo admin: admin@demo.nkp / demo1234
        </p>
      </div>
    </main>
  );
}
