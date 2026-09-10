import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 no longer allows any quality by default; it must be declared.
    // Every image on this site is a local file under /public/media, so there
    // are no remotePatterns to allow.
    qualities: [75, 90],
  },

  // Trailing slashes off keeps one canonical URL per route for the sitemap.
  trailingSlash: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The site never renders in a frame, and clickjacking a payment flow
          // is the specific risk worth closing here.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Vercel terminates TLS, so HSTS is safe to assert.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Fingerprinted build assets are immutable.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
};

export default nextConfig;
