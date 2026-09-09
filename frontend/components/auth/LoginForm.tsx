"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@demo.nkp", note: "Sees only their own company's data" },
  { label: "Admin", email: "admin@demo.nkp", note: "Full access — invoicing, tickets, all accounts" },
];

const inputCls =
  "w-full border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-3 focus:border-ink focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(withEmail: string, withPassword: string) {
    setBusy(true);
    setError(null);
    try {
      await login(withEmail, withPassword);
      // Only follow `next` when it is a path on this site — an absolute URL
      // here would be an open redirect.
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/ai");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That email and password do not match an account."
          : "Could not sign in. Is the API running on port 8080?",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold text-ink">Sign in</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">
        Access invoices, payments and the ops copilot.
      </p>

      <form
        noValidate
        className="mt-7 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(email, password);
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={inputCls}
          />
        </label>

        {error && (
          <p role="alert" className="border-l-2 border-danger bg-danger-soft p-3 text-[13px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 border border-line bg-mist p-5">
        <p className="eyebrow mb-3">Demo accounts</p>
        <ul className="flex flex-col gap-2.5">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmail(account.email);
                  setPassword("demo1234");
                  submit(account.email, "demo1234");
                }}
                className="w-full border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:border-ink disabled:opacity-50"
              >
                <span className="block text-[13px] font-semibold text-ink">
                  {account.label} — {account.email}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-ink-3">{account.note}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-ink-3">
          Password for both is <code className="font-mono">demo1234</code>. Seeded demo data only.
        </p>
      </div>
    </div>
  );
}
