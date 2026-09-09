import type { MetadataRoute } from "next";

const BASE = "https://nkplogistics.in";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/services/warehousing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ai", priority: 0.8, changeFrequency: "monthly" },
  { path: "/track", priority: 0.7, changeFrequency: "weekly" },
  { path: "/support", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
