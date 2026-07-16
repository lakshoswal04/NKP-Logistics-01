"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { askCopilot, type CopilotResult } from "@/lib/aiApi";
import { CHART_GRID, CHART_TICK, ModuleShell, SERIES, inputCls } from "@/components/ai/Primitives";

interface Turn {
  question: string;
  result?: CopilotResult;
  error?: boolean;
}

const STARTERS = [
  "How many shipments are in transit right now?",
  "Which shipments are delayed?",
  "What's the delay risk on our active shipments?",
  "Forecast demand for Mumbai → Delhi",
];

function MiniChart({ chart }: { chart: NonNullable<CopilotResult["chart"]> }) {
  const data = chart.series.map((s) => ({ label: s.label, value: s.value }));
  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(255,255,255,0.04)" }}
      contentStyle={{
        background: "rgba(18,18,22,0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        fontSize: 12,
        color: "#f5f5f7",
      }}
    />
  );
  return (
    <div className="mt-3 h-44">
      <ResponsiveContainer width="100%" height="100%">
        {chart.type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="label" tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} />
            <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} allowDecimals={false} />
            {tooltip}
            <Bar dataKey="value" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_TICK, fontSize: 11 }}
              stroke={CHART_GRID}
              tickFormatter={(d: string) => d.slice(5)}
              minTickGap={30}
            />
            <YAxis tick={{ fill: CHART_TICK, fontSize: 11 }} stroke={CHART_GRID} />
            {tooltip}
            <Line dataKey="value" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-line text-ink-3">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 font-medium capitalize">
                {c.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/50 last:border-0">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-ink-2">
                  {String(row[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CopilotModule({ badge }: { badge?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const m = useMutation({
    mutationFn: askCopilot,
    onSuccess: (result, question) => {
      setTurns((t) => [...t.filter((x) => x.result || x.error), { question, result }]);
      queueScroll();
    },
    onError: (_e, question) => {
      setTurns((t) => [...t.filter((x) => x.result || x.error), { question, error: true }]);
    },
  });

  function queueScroll() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function ask(question: string) {
    const q = question.trim();
    if (!q || m.isPending) return;
    setTurns((t) => [...t, { question: q }]);
    setInput("");
    m.mutate(q);
    queueScroll();
  }

  return (
    <ModuleShell
      index={6}
      title="AI Operations Copilot"
      tagline="Ask questions about the network in plain language — answered from live platform data."
      badge={badge}
      className="lg:col-span-2"
    >
      <div ref={scrollRef} className="max-h-96 space-y-4 overflow-y-auto pr-1">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="glass rounded-full px-3.5 py-1.5 text-xs text-ink-2 transition-colors hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((turn, i) => (
          <div key={i}>
            <div className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">
                {turn.question}
              </p>
            </div>
            <div className="mt-2 flex justify-start">
              <div className="glass max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                {!turn.result && !turn.error && <span className="text-ink-3">Analyzing…</span>}
                {turn.error && <span className="text-danger">Something went wrong — try again.</span>}
                {turn.result && (
                  <>
                    <p className="leading-relaxed text-ink">{turn.result.answer}</p>
                    {turn.result.chart && <MiniChart chart={turn.result.chart} />}
                    {turn.result.data && turn.result.data.length > 0 && <DataTable rows={turn.result.data} />}
                    {turn.result.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {turn.result.suggestions.slice(0, 3).map((s) => (
                          <button
                            key={s}
                            onClick={() => ask(s)}
                            className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-2 hover:text-ink"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="copilot-q" className="sr-only">
          Ask the copilot
        </label>
        <input
          id="copilot-q"
          className={inputCls}
          placeholder="e.g. which shipments are delayed?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={m.isPending}
          className="shrink-0 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </ModuleShell>
  );
}
