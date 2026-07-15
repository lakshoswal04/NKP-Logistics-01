import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/content";

const BASE = "https://nkplogistics.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/services",
    "/solutions",
    "/technology",
    "/track",
    "/about",
    "/contact",
    "/careers",
    "/blog",
    "/case-studies",
    "/faq",
    "/privacy",
    "/terms",
  ];
  return [
    ...staticPaths.map((p) => ({ url: `${BASE}${p}`, lastModified: new Date() })),
    ...POSTS.map((post) => ({ url: `${BASE}/blog/${post.slug}`, lastModified: new Date(post.date) })),
  ];
}
