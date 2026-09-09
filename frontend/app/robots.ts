import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Customer data and the payment return path have no business in an index.
      disallow: ["/dashboard/", "/login", "/api/"],
    },
    sitemap: "https://nkplogistics.in/sitemap.xml",
  };
}
