"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { SUPPORT_CATEGORIES } from "@/lib/content";

/**
 * Support centre: category rail on the left, searchable topics on the right.
 *
 * Search filters across every category rather than only the selected one — if
 * someone types "GSTIN" they want the answer, not a reminder that they are
 * looking in the wrong section.
 */
export function SupportCentre() {
  const [activeSlug, setActiveSlug] = useState<string>(SUPPORT_CATEGORIES[0].slug);
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(
    `${SUPPORT_CATEGORIES[0].slug}-0`,
  );

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) {
      const category = SUPPORT_CATEGORIES.find((c) => c.slug === activeSlug)!;
      return [{ category, topics: category.topics.map((t, i) => ({ ...t, key: `${category.slug}-${i}` })) }];
    }
    return SUPPORT_CATEGORIES.map((category) => ({
      category,
      topics: category.topics
        .map((t, i) => ({ ...t, key: `${category.slug}-${i}` }))
        .filter((t) => `${t.q} ${t.a}`.toLowerCase().includes(trimmed)),
    })).filter((group) => group.topics.length > 0);
  }, [trimmed, activeSlug]);

  const hitCount = results.reduce((sum, group) => sum + group.topics.length, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
      <nav aria-label="Support categories">
        <ul className="border border-line">
          {SUPPORT_CATEGORIES.map((category) => {
            const active = !trimmed && category.slug === activeSlug;
            return (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlug(category.slug);
                    setQuery("");
                    setOpenIndex(`${category.slug}-0`);
                  }}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left text-[14px] font-medium transition-colors last:border-b-0",
                    active ? "bg-mist text-ink" : "bg-white text-ink-2 hover:bg-mist/60",
                  )}
                >
                  <span
                    className={cn("h-2.5 w-2.5 shrink-0", active ? "bg-accent" : "bg-line-strong")}
                    aria-hidden
                  />
                  {category.title}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div>
        <label htmlFor="support-search" className="sr-only">
          Search support topics
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="support-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type the topic you need help with"
            className="w-full border border-line-strong bg-white py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
          />
        </div>

        {trimmed && (
          <p className="mt-3 text-[12.5px] text-ink-3" role="status">
            {hitCount === 0
              ? `Nothing matches “${query.trim()}”. Try a different word, or raise a query below.`
              : `${hitCount} ${hitCount === 1 ? "answer" : "answers"} matching “${query.trim()}”`}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-8">
          {results.map(({ category, topics }) => (
            <section key={category.slug}>
              <h3 className="mb-4 font-display text-[16px] font-bold text-ink">{category.title}</h3>
              <div className="flex flex-col gap-2">
                {topics.map((topic) => {
                  const open = openIndex === topic.key;
                  return (
                    <article key={topic.key} className="border border-line bg-white">
                      <h4>
                        <button
                          type="button"
                          onClick={() => setOpenIndex(open ? null : topic.key)}
                          aria-expanded={open}
                          className="flex w-full items-start justify-between gap-4 p-4 text-left"
                        >
                          <span className="border-l-2 border-accent pl-3 text-[14.5px] font-semibold text-ink">
                            {topic.q}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[19px] font-normal leading-none text-accent-ink transition-transform",
                              open && "rotate-45",
                            )}
                            aria-hidden
                          >
                            +
                          </span>
                        </button>
                      </h4>
                      {open && (
                        <p className="border-t border-line px-4 py-4 pl-[26px] text-[13.5px] leading-relaxed text-ink-2">
                          {topic.a}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
