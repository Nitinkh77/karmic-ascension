import type { NextConfig } from "next";

// Allow next/image to optimise images served from the project's Supabase Storage.
let supabaseHost: string | undefined;
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  supabaseHost = undefined;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Modern formats are served automatically: large JPG uploads are re-encoded to AVIF/WebP and resized per device.
    formats: ["image/avif", "image/webp"],
    // Optimised copies are cached for a day, so repeat visits and other visitors get them instantly.
    minimumCacheTTL: 86400,
    remotePatterns: supabaseHost
      ? [{ hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  experimental: {
    // Media uploads are capped at 5 MB in the app; leave headroom for form overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
