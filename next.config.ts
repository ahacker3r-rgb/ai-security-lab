import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is only for the self-hosted Docker deployment —
  // it produces a different build artifact layout that conflicts with
  // Vercel's own build pipeline (Vercel sets VERCEL=1 during its builds).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
