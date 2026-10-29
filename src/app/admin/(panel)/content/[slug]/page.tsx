import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Card, Check, Field, PageTitle } from "@/components/admin/ui";
import { MediaSelect } from "@/components/admin/MediaSelect";
import { ensurePage, savePageMeta, saveSection } from "@/app/admin/(panel)/actions";
import { listMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { getDefaultPage } from "@/lib/defaults";
import { itemsToText } from "@/lib/utils";

export const metadata = { title: "Edit page" };

export default async function EditPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getDefaultPage(slug);
  if (!def) notFound();
  const { supabase } = await requireAdmin();

  const [{ data: page }, assets] = await Promise.all([
    supabase.from("pages").select("id, title, meta_title, meta_description, is_published, is_draft").eq("slug", slug).maybeSingle(),
    listMedia(supabase),
  ]);
  const { data: rows } = page
    ? await supabase.from("page_sections").select("*").eq("page_id", page.id)
    : { data: [] as Array<Record<string, unknown>> };
  const byKey = new Map<string, Record<string, unknown>>();
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) byKey.set(String(r.section_key), r);

  // Merge built-in sections with saved ones so every editable block is listed.
  const sections = def.sections
    .map((d) => {
      const r = byKey.get(d.key);
      return {
        key: d.key,
        label: d.label,
        saved: !!r,
        eyebrow: (r ? r.eyebrow : d.eyebrow) as string | null | undefined,
        heading: (r ? r.heading : d.heading) as string | null | undefined,
        body: (r ? r.body : d.body) as string | null | undefined,
        items: (r ? (r.items as Array<{ title: string; text: string }>) : d.items) ?? [],
        cta_label: (r ? r.cta_label : d.ctaLabel) as string | null | undefined,
        cta_href: (r ? r.cta_href : d.ctaHref) as string | null | undefined,
        image_asset_id: (r?.image_asset_id as string | null | undefined) ?? null,
        sort_order: Number(r ? r.sort_order : d.sortOrder),
        is_visible: r ? Boolean(r.is_visible) : (d.isVisible ?? true),
        is_draft: r ? Boolean(r.is_draft) : (d.draft ?? false),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All pages
      </Link>
      <PageTitle title={def.title} description="Changes appear on the public site within seconds of saving.">
        <Link href={slug === "home" ? "/" : `/${slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
          Preview page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </PageTitle>

      <Card>
        <h2 className="mb-1 text-xl text-maroon">Page settings</h2>
        {!page && (
          <p className="mb-4 text-sm text-ink-soft">
            This page is currently showing built-in text. Saving page settings creates it in the database so its sections can be edited.
          </p>
        )}
        <AdminForm action={savePageMeta} submitLabel={page ? "Save page settings" : "Create page in database"}>
          <input type="hidden" name="slug" value={slug} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Page title" name="title"><input id="title" name="title" required defaultValue={page?.title ?? def.title} className="field" /></Field>
            <Field label="SEO title (optional)" name="meta_title"><input id="meta_title" name="meta_title" defaultValue={page?.meta_title ?? def.metaTitle ?? ""} className="field" maxLength={120} /></Field>
          </div>
          <Field label="SEO description" name="meta_description"><textarea id="meta_description" name="meta_description" rows={2} defaultValue={page?.meta_description ?? def.metaDescription} className="field" maxLength={300} /></Field>
          <div className="space-y-3">
            <Check name="is_published" label="Published" hint="Untick to take the page offline (visitors see “not found”)." defaultChecked={page?.is_published ?? true} />
            <Check name="is_draft" label="Draft — needs review" hint="Draft pages show a notice and are hidden from search engines." defaultChecked={page?.is_draft ?? def.draft ?? false} />
          </div>
        </AdminForm>
      </Card>

      {!page ? (
        <p className="mt-6 text-sm text-ink-soft">Create the page above to edit its sections.</p>
      ) : (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl text-maroon">Sections</h2>
          <p className="-mt-3 text-sm text-ink-soft">Click a section to open and edit it.</p>
          {sections.map((s) => (
            <details key={s.key} className="group rounded-2xl border border-sand bg-white-warm shadow-card open:border-gold">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-parchment/50 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xl text-maroon">{s.label}</span>
                    {!s.saved && <Badge tone="grey">built-in text</Badge>}
                    {s.is_draft && <Badge tone="saffron">needs review</Badge>}
                    {!s.is_visible && <Badge tone="red">hidden</Badge>}
                  </span>
                  {(s.heading || s.body) && <span className="mt-0.5 block truncate text-sm text-ink-soft">{s.heading || s.body}</span>}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-sand p-5 sm:p-6">
              <AdminForm action={saveSection} submitLabel="Save section">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="section_key" value={s.key} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Small heading above title" name={`${s.key}_eyebrow`}><input id={`${s.key}_eyebrow`} name="eyebrow" defaultValue={s.eyebrow ?? ""} className="field" /></Field>
                  <Field label="Heading" name={`${s.key}_heading`}><input id={`${s.key}_heading`} name="heading" defaultValue={s.heading ?? ""} className="field" /></Field>
                </div>
                <Field label="Text" name={`${s.key}_body`} hint="Blank line = new paragraph. Legal pages: start a line with “## ” for a sub-heading.">
                  <textarea id={`${s.key}_body`} name="body" rows={s.key.startsWith("legal") ? 14 : 5} defaultValue={s.body ?? ""} className="field" />
                </Field>
                <Field label="List items (one per line: Title | Text)" name={`${s.key}_items_text`} hint="Used by sections that show cards or steps.">
                  <textarea id={`${s.key}_items_text`} name="items_text" rows={3} defaultValue={itemsToText(s.items)} className="field font-mono text-sm" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Button label" name={`${s.key}_cta_label`}><input id={`${s.key}_cta_label`} name="cta_label" defaultValue={s.cta_label ?? ""} className="field" /></Field>
                  <Field label="Button link" name={`${s.key}_cta_href`}><input id={`${s.key}_cta_href`} name="cta_href" defaultValue={s.cta_href ?? ""} className="field" placeholder="/book" /></Field>
                </div>
                <MediaSelect name="image_asset_id" assets={assets} defaultValue={s.image_asset_id} label="Section image (where the layout has one)" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Order on page" name={`${s.key}_sort_order`} hint="Lower numbers appear first."><input id={`${s.key}_sort_order`} name="sort_order" type="number" min={0} defaultValue={s.sort_order} className="field" /></Field>
                  <div className="space-y-3 pt-6">
                    <Check name="is_visible" label="Visible" defaultChecked={s.is_visible} />
                    <Check name="is_draft" label="Needs owner review" defaultChecked={s.is_draft} />
                  </div>
                </div>
              </AdminForm>
              </div>
            </details>
          ))}
        </div>
      )}

      {!page && (
        <form action={ensurePage.bind(null, slug, def.title)} className="mt-4">
          <button type="submit" className="text-sm font-semibold text-maroon underline">Quick-create with default settings</button>
        </form>
      )}
    </>
  );
}
