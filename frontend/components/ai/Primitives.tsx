import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { AiMode } from "@/lib/aiApi";

/** Numbered module shell with a consistent header and provenance footer. */
export function ModuleCard({
  index,
  title,
  tagline,
  mode,
  model,
  className,
  children,
}: {
  index: number;
  title: string;
  tagline: string;
  mode?: AiMode;
  model?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col border border-line bg-white", className)}>
      <header className="border-b border-line p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-display text-[12px] font-bold text-brand">
              {String(index).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-[19px] font-bold text-ink">{title}</h3>
            <p className="mt-1.5 max-w-[440px] text-[13px] leading-relaxed text-ink-2">{tagline}</p>
          </div>
          {mode && <ModeBadge mode={mode} model={model} />}
        </div>
      </header>
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </section>
  );
}

export function ModeBadge({ mode, model }: { mode: AiMode; model?: string | null }) {
  const live = mode === "live";
  return (
    <span
      title={
        live
          ? `Answered by ${model ?? "Gemini"}`
          : "No model key configured — composed by rules from live data"
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide",
        live ? "bg-success-soft text-success" : "bg-mist text-ink-3",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-success" : "bg-ink-3")}
        aria-hidden
      />
      {live ? "Gemini" : "Rules"}
    </span>
  );
}

/** Small badges naming the tools a copilot answer actually called. */
export function ToolTrace({ tools }: { tools: string[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10.5px] uppercase tracking-wide text-ink-3">Queried</span>
      {tools.map((tool, i) => (
        <code
          key={`${tool}-${i}`}
          className="rounded-[2px] bg-mist px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2"
        >
          {tool}()
        </code>
      ))}
    </div>
  );
}

/** Horizontal risk meter. */
export function RiskMeter({ value, band }: { value: number; band: string }) {
  const pct = Math.round(value * 100);
  const tone =
    band === "high" ? "bg-danger" : band === "medium" ? "bg-warning" : "bg-success";
  const text =
    band === "high" ? "text-danger" : band === "medium" ? "text-warning" : "text-success";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] uppercase tracking-wide text-ink-3">RTO risk</span>
        <span className={cn("font-display text-[24px] font-bold", text)}>{pct}%</span>
      </div>
      <div
        className="mt-2 h-2 w-full bg-mist"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Return-to-origin risk"
      >
        <div className={cn("h-full transition-all duration-500", tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn("mt-1.5 text-[11.5px] font-semibold uppercase tracking-wide", text)}>
        {band} risk
      </p>
    </div>
  );
}

export const inputCls =
  "w-full border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-3 focus:border-ink focus:outline-none";

export const labelCls = "mb-1.5 block text-[12.5px] font-medium text-ink-2";

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-3">
      {children ??
        "AI output for decision support, not ground truth. A human confirms every action."}
    </p>
  );
}

/** Minimal markdown: bold, inline code, and pipe tables. Enough for copilot answers. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split("\n\n");
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.trimStart().startsWith("|")) {
          return <MarkdownTable key={i} block={block} />;
        }
        return (
          <p key={i} className="text-[14px] leading-relaxed text-ink-2">
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function MarkdownTable({ block }: { block: string }) {
  const rows = block
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  if (rows.length < 2) return null;

  const cells = (line: string) =>
    line.split("|").slice(1, -1).map((c) => c.trim());
  const head = cells(rows[0]);
  // rows[1] is the |---|---| separator
  const body = rows.slice(2).map(cells);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border-b border-line-strong px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border-b border-line px-2 py-2 text-ink-2">
                  {j === 0 ? <span className="font-medium text-ink">{cell}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
