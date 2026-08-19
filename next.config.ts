import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Sent on every response.
 *
 * `X-Frame-Options` matters more here than it usually would: the CSRF story at
 * this origin rests entirely on the `SameSite=Lax` FastAPI sets on the session
 * cookie, which says nothing about framing — and the one-click approve/cancel
 * actions on a purchase request are exactly what a clickjacking overlay would
 * target.
 *
 * A full `Content-Security-Policy` is deliberately not here yet: Next injects
 * inline bootstrap scripts, so it needs a nonce and a pass over every page
 * before it can be enforced without breaking the app.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Ignored over plain HTTP, so it is pointless in dev and harmful only if the
  // production host is ever served without TLS.
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Every BFF response is per-user and authenticated. Next renders these
        // dynamically already; this is for the intermediaries it cannot see —
        // a CDN, a reverse proxy, the browser's back/forward cache.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
