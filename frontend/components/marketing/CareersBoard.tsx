"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { JOBS } from "@/lib/content";
import { cn } from "@/lib/cn";

const ALL = "All";

export function CareersBoard() {
  const [dept, setDept] = useState(ALL);
  const depts = useMemo(() => [ALL, ...Array.from(new Set(JOBS.map((j) => j.dept)))], []);
  const jobs = dept === ALL ? JOBS : JOBS.filter((j) => j.dept === dept);

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by department">
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              d === dept ? "bg-accent text-white" : "glass text-ink-2 hover:text-ink",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {jobs.map((job) => (
          <GlassCard
            key={job.title}
            className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-display text-lg font-semibold">{job.title}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {job.dept} · {job.location} · {job.type}
              </p>
            </div>
            <Button
              href={`/contact?service=${encodeURIComponent(`Careers — ${job.title}`)}`}
              variant="secondary"
              className="shrink-0 px-5 py-2.5"
            >
              Apply
            </Button>
          </GlassCard>
        ))}
        {jobs.length === 0 && <p className="py-10 text-center text-ink-2">No open roles in this department right now.</p>}
      </div>
    </section>
  );
}
