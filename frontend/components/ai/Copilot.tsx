"use client";

import { useRef, useState } from "react";
import { useSyncExternalStore } from "react";

import { Disclaimer, RichText, ToolTrace, inputCls } from "@/components/ai/Primitives";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { streamCopilot, type AiMode } from "@/lib/aiApi";

interface Turn {
  role: "user" | "assistant";
  text: string;
  tools?: string[];
  mode?: AiMode;
  model?: string;
  streaming?: boolean;
}

const noopSubscribe = () => () => {};

export function Copilot({ suggestions }: { suggestions: string[] }) {
  // useSyncExternalStore keeps the server render and first client render in
  // agreement — reading localStorage during render directly would hydrate
  // mismatched.
  const token = useSyncExternalStore(noopSubscribe, getAccessToken, () => null);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;

    setError(null);
    setQuestion("");
    setBusy(true);
    setTurns((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: "", streaming: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const patchLast = (patch: Partial<Turn>) =>
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], ...patch };
        return next;
      });

    try {
      await streamCopilot(q, {
        signal: controller.signal,
        onMeta: (meta) => patchLast({ tools: meta.tools_used, mode: meta.mode, model: meta.model }),
        onText: (chunk) =>
          setTurns((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, text: last.text + chunk };
            return next;
          }),
        onDone: (meta) => patchLast({ streaming: false, mode: meta.mode, model: meta.model }),
        onError: (message) => {
          patchLast({ streaming: false });
          setError(message);
        },
      });
    } catch (err) {
      setTurns((prev) => prev.slice(0, -2));
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your session has expired. Sign in again to use the copilot."
          : "The copilot is unavailable right now. Please try again.",
      );
    } finally {
      patchLast({ streaming: false });
      setBusy(false);
      abortRef.current = null;
    }
  }

  if (!token) {
    return (
      <div className="border border-line bg-mist p-8 text-center">
        <h3 className="font-display text-[19px] font-bold text-ink">Sign in to use the copilot</h3>
        <p className="mx-auto mt-3 max-w-[440px] text-[13.5px] leading-relaxed text-ink-2">
          The copilot answers from your own consignments, invoices and receivables, so it needs to
          know who you are. The four tools below are open to everyone.
        </p>
        <Button href="/login" className="mt-6" withArrow>
          Sign in
        </Button>
        <p className="mt-4 text-[11.5px] text-ink-3">
          Demo account: customer@demo.nkp / demo1234
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex max-h-[440px] min-h-[220px] flex-col gap-5 overflow-y-auto border border-line bg-mist p-5"
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation"
      >
        {turns.length === 0 && (
          <p className="m-auto max-w-[380px] text-center text-[13.5px] leading-relaxed text-ink-3">
            Ask about your consignments, invoices or receivables. Every answer is looked up in your
            data at the moment you ask — nothing is recalled or estimated.
          </p>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <p key={i} className="self-end max-w-[80%] bg-ink px-4 py-2.5 text-[13.5px] text-white">
              {turn.text}
            </p>
          ) : (
            <div key={i} className="max-w-[92%] bg-white p-4">
              {turn.tools && turn.tools.length > 0 && (
                <div className="mb-3">
                  <ToolTrace tools={turn.tools} />
                </div>
              )}
              {turn.text ? (
                <RichText text={turn.text} />
              ) : (
                <p className="text-[13.5px] text-ink-3">
                  <span className="inline-block animate-pulse">Looking it up…</span>
                </p>
              )}
              {turn.streaming && turn.text && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" />
              )}
            </div>
          ),
        )}
      </div>

      {turns.length === 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => ask(suggestion)}
                className="border border-line-strong px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-4 border-l-2 border-danger bg-danger-soft p-3 text-[13px] text-danger">
          {error}
        </p>
      )}

      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="copilot-input" className="sr-only">
          Ask the copilot
        </label>
        <input
          id="copilot-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Where is NKP2026A1B2?"
          className={inputCls}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !question.trim()}>
          {busy ? "Asking…" : "Ask"}
        </Button>
      </form>

      <Disclaimer>
        Read-only. The copilot can look things up and summarise them; it cannot raise an invoice,
        send email, take payment or change a consignment.
      </Disclaimer>
    </div>
  );
}
