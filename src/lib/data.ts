import "server-only";
import { cache } from "react";
import { isSupabaseConfigured, MEDIA_BUCKET, supabaseUrl } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import {
  DEFAULT_PAGES,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  getDefaultPage,
  type DefaultPage,
} from "@/lib/defaults";
import type {
  AvailabilityRule,
  Faq,
  PageMeta,
  Section,
  SectionItem,
  Service,
  SiteSettings,
  Testimonial,
  UnavailableRange,
} from "@/lib/types";

export type SiteStatus =
  | { status: "ok" }
  | { status: "not_configured" }
  | { status: "error"; reason: string };

export function mediaPublicUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath || !supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

function logError(scope: string, err: unknown) {
  console.error(`[data:${scope}]`, err instanceof Error ? err.message : err);
}

/* ------------------------------------------------------------------ settings */

export const getSettingsResult = cache(
  async (): Promise<{ settings: SiteSettings; site: SiteStatus }> => {
    if (!isSupabaseConfigured) {
      return { settings: DEFAULT_SETTINGS, site: { status: "not_configured" } };
    }
    try {
      const sb = createPublicClient();
      const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      if (!data) {
        return {
          settings: DEFAULT_SETTINGS,
          site: {
            status: "error",
            reason: "No site_settings row found. Run supabase/seed.sql after the migrations.",
          },
        };
      }
      return { settings: data as SiteSettings, site: { status: "ok" } };
    } catch (e) {
      logError("settings", e);
      return {
        settings: DEFAULT_SETTINGS,
        site: {
          status: "error",
          reason: "Could not read from Supabase. Check your keys and that the migrations were run.",
        },
      };
    }
  },
);

export async function getSettings(): Promise<SiteSettings> {
  return (await getSettingsResult()).settings;
}

/* --------------------------------------------------------------------- pages */

function toSection(
  def: DefaultPage["sections"][number] | undefined,
  row?: Record<string, unknown>,
): Section {
  if (row) {
    const media = Array.isArray(row.media) ? row.media[0] : row.media;
    const m = media as { storage_path?: string; alt_text?: string } | null | undefined;
    return {
      key: String(row.section_key),
      eyebrow: (row.eyebrow as string | null) ?? null,
      heading: (row.heading as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      items: Array.isArray(row.items) ? (row.items as SectionItem[]) : [],
      ctaLabel: (row.cta_label as string | null) ?? null,
      ctaHref: (row.cta_href as string | null) ?? null,
      imageUrl: mediaPublicUrl(m?.storage_path),
      imageAlt: m?.alt_text ?? "",
      imageAssetId: (row.image_asset_id as string | null) ?? null,
      sortOrder: Number(row.sort_order ?? 0),
      isVisible: Boolean(row.is_visible),
      isDraft: Boolean(row.is_draft),
      isDefault: false,
    };
  }
  const d = def!;
  return {
    key: d.key,
    eyebrow: d.eyebrow ?? null,
    heading: d.heading ?? null,
    body: d.body ?? null,
    items: d.items ?? [],
    ctaLabel: d.ctaLabel ?? null,
    ctaHref: d.ctaHref ?? null,
    imageUrl: null,
    imageAlt: "",
    imageAssetId: null,
    sortOrder: d.sortOrder,
    isVisible: d.isVisible ?? true,
    isDraft: d.draft ?? false,
    isDefault: true,
  };
}

function fromDefaults(def: DefaultPage | undefined, slug: string) {
  return {
    notFound: false as const,
    meta: {
      slug,
      title: def?.title ?? slug,
      metaTitle: def?.metaTitle ?? null,
      metaDescription: def?.metaDescription ?? null,
      isPublished: true,
      isDraft: def?.draft ?? false,
    } satisfies PageMeta,
    sections: (def?.sections ?? []).map((s) => toSection(s)).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export type PageContent =
  | { notFound: true }
  | { notFound: false; meta: PageMeta; sections: Section[] };

export const getPageContent = cache(async (slug: string): Promise<PageContent> => {
  const def = getDefaultPage(slug);
  if (!isSupabaseConfigured) return fromDefaults(def, slug);

  try {
    const sb = createPublicClient();
    const { data: page, error } = await sb
      .from("pages")
      .select("id, slug, title, meta_title, meta_description, is_published, is_draft")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;

    if (!page) {
      // RLS hides unpublished pages: distinguish "unpublished" from "never created".
      const { data: exists } = await sb.rpc("page_exists", { p_slug: slug });
      if (exists) return { notFound: true };
      return fromDefaults(def, slug);
    }

    const { data: rows, error: secErr } = await sb
      .from("page_sections")
      .select("*, media:media_assets(storage_path, alt_text)")
      .eq("page_id", page.id);
    if (secErr) throw secErr;

    const byKey = new Map<string, Section>();
    for (const d of def?.sections ?? []) byKey.set(d.key, toSection(d));
    for (const r of rows ?? []) byKey.set(String(r.section_key), toSection(undefined, r));

    // RLS hides hidden sections from anon, so a built-in default for the same key
    // would reappear. Ask the database which keys the owner has hidden and drop them.
    const { data: hidden } = await sb.rpc("hidden_section_keys", { p_slug: slug });
    for (const key of (hidden as string[] | null) ?? []) byKey.delete(key);
    const sections = [...byKey.values()].sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      notFound: false,
      meta: {
        slug: page.slug,
        title: page.title,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
        isPublished: page.is_published,
        isDraft: page.is_draft,
      },
      sections,
    };
  } catch (e) {
    logError(`page:${slug}`, e);
    return fromDefaults(def, slug);
  }
});

export function sectionByKey(sections: Section[], key: string): Section | undefined {
  return sections.find((s) => s.key === key);
}

/* ------------------------------------------------------------------ services */

function toService(r: Record<string, unknown>): Service {
  const media = Array.isArray(r.media) ? r.media[0] : r.media;
  const m = media as { storage_path?: string; alt_text?: string } | null | undefined;
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    short_description: String(r.short_description ?? ""),
    description: String(r.description ?? ""),
    price_paise: (r.price_paise as number | null) ?? null,
    currency: String(r.currency ?? "INR"),
    duration_minutes: Number(r.duration_minutes ?? 30),
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    deliverables: Array.isArray(r.deliverables) ? (r.deliverables as string[]) : [],
    image_asset_id: (r.image_asset_id as string | null) ?? null,
    imageUrl: mediaPublicUrl(m?.storage_path),
    imageAlt: m?.alt_text ?? "",
    status: r.status as Service["status"],
    is_featured: Boolean(r.is_featured),
    requires_birth_details: Boolean(r.requires_birth_details),
    is_draft: Boolean(r.is_draft),
    sort_order: Number(r.sort_order ?? 0),
  };
}

export const getServices = cache(async (): Promise<Service[]> => {
  if (!isSupabaseConfigured) return DEFAULT_SERVICES;
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("services")
      .select("*, media:media_assets(storage_path, alt_text)")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toService);
  } catch (e) {
    logError("services", e);
    return [];
  }
});

export async function getFeaturedServices(): Promise<Service[]> {
  const all = await getServices();
  const featured = all.filter((s) => s.is_featured);
  return (featured.length ? featured : all).slice(0, 3);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

/* ------------------------------------------------------- FAQs & testimonials */

export const getFaqs = cache(async (serviceId?: string | null): Promise<Faq[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const sb = createPublicClient();
    let q = sb
      .from("faqs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    q = serviceId ? q.eq("service_id", serviceId) : q.is("service_id", null);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Faq[];
  } catch (e) {
    logError("faqs", e);
    return [];
  }
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .eq("is_verified", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Testimonial[];
  } catch (e) {
    logError("testimonials", e);
    return [];
  }
});

/* -------------------------------------------------------------- availability */

export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("availability_rules")
      .select("weekday, start_time, end_time, is_active")
      .order("weekday");
    if (error) throw error;
    return (data ?? []) as AvailabilityRule[];
  } catch (e) {
    logError("availability", e);
    return [];
  }
}

export async function getUnavailable(from: string, to: string): Promise<UnavailableRange[]> {
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("get_unavailable", { p_from: from, p_to: to });
  if (error) throw error;
  return (data ?? []) as UnavailableRange[];
}

/** Public URL of the default Open Graph image chosen in Admin → Settings (if any). */
export async function getOgImageUrl(settings: SiteSettings): Promise<string | null> {
  if (!isSupabaseConfigured || !settings.og_image_asset_id) return null;
  try {
    const sb = createPublicClient();
    const { data } = await sb
      .from("media_assets")
      .select("storage_path")
      .eq("id", settings.og_image_asset_id)
      .maybeSingle();
    return mediaPublicUrl(data?.storage_path);
  } catch {
    return null;
  }
}

export { DEFAULT_PAGES };
