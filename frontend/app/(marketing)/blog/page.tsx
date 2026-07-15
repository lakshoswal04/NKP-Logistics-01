import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/marketing/PageHeader";
import { POSTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description: "Insights on Indian logistics, supply chain technology and operations.",
};

export default function BlogPage() {
  return (
    <>
      <PageHeader eyebrow="Blog & resources" title="Notes from the network" />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {POSTS.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.05}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <GlassCard className="flex h-full flex-col p-7 transition-colors group-hover:border-white/20">
                  <p className="eyebrow">{post.category}</p>
                  <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{post.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-ink-3">
                    {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </GlassCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
