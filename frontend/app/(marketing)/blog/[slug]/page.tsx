import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { POSTS } from "@/lib/content";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:pt-40">
      <Eyebrow>{post.category}</Eyebrow>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-ink-3">
        {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <div className="mt-8 space-y-5 leading-relaxed text-ink-2">
        {post.body.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <div className="mt-12 border-t border-line pt-6">
        <Link href="/blog" className="text-sm font-medium text-accent hover:text-accent-hover">
          ← All articles
        </Link>
      </div>
    </article>
  );
}
