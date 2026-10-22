import "server-only";
import type { Metadata } from "next";
import { getOgImageUrl, getPageContent, getSettingsResult } from "@/lib/data";

/** Page-specific metadata from the editable page record (falls back to defaults). */
export async function pageMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await getPageContent(slug);
  if (page.notFound) return { title: "Page not found", robots: { index: false, follow: false } };

  const { settings } = await getSettingsResult();
  const title = page.meta.metaTitle || page.meta.title;
  const description =
    page.meta.metaDescription || settings.seo_description || settings.description || undefined;
  const og = await getOgImageUrl(settings);

  return {
    title: slug === "home" ? { absolute: settings.seo_title || title } : title,
    description,
    alternates: { canonical: path },
    // Draft legal text must not be indexed until the owner has reviewed it.
    robots: page.meta.isDraft ? { index: false, follow: true } : undefined,
    openGraph: {
      title: slug === "home" ? settings.seo_title || title : title,
      description,
      url: path,
      images: og ? [{ url: og }] : undefined,
    },
  };
}
