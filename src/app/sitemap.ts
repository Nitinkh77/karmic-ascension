import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getServices } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const fixed = ["", "/services", "/how-it-works", "/reviews", "/about", "/faq", "/book", "/contact"].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  // Draft legal pages are excluded from the sitemap until the owner has reviewed them (they are also noindex).
  const dynamic = services
    .filter((s) => !s.isDefault)
    .map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  return [...fixed, ...dynamic];
}
