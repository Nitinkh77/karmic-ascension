import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getServices } from "@/lib/data";
import { RASHIS } from "@/lib/astro/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const fixed = ["", "/services", "/horoscope", "/kundali", "/kundli-matching", "/how-it-works", "/reviews", "/about", "/faq", "/book", "/contact"].map((p) => ({
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
  const signs = RASHIS.map((r) => ({
    url: `${siteUrl}/horoscope/${r.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
  return [...fixed, ...dynamic, ...signs];
}
