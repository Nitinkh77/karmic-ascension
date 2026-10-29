import Link from "next/link";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Check, Empty, Field, PageTitle } from "@/components/admin/ui";
import { deleteTestimonial, saveTestimonial, setTestimonialPublished } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";
import type { Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Testimonials" };

const FILTERS = [
  ["all", "All"],
  ["published", "Published"],
  ["hidden", "Hidden"],
  ["unverified", "Unverified"],
] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TestimonialsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80).toLowerCase();
  const show = FILTERS.some(([k]) => k === one(sp.show)) ? one(sp.show) : "all";

  const { data } = await supabase.from("testimonials").select("*").order("sort_order").order("created_at").limit(1000);
  const all = (data ?? []) as Testimonial[];

  const counts = {
    all: all.length,
    published: all.filter((t) => t.is_published).length,
    hidden: all.filter((t) => !t.is_published).length,
    unverified: all.filter((t) => !t.is_verified).length,
  };
  const rows = all.filter((t) => {
    if (show === "published" && !t.is_published) return false;
    if (show === "hidden" && t.is_published) return false;
    if (show === "unverified" && t.is_verified) return false;
    if (q && !`${t.author_name} ${t.quote} ${t.source ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const href = (s: string) => `/admin/testimonials?show=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageTitle
        title="Testimonials"
        description="Only real client words you have permission to publish. A testimonial goes live only when it is ticked both Verified and Published — the database enforces this."
      />

      <details className="group mb-6 rounded-2xl border border-sand bg-white-warm shadow-card" open={all.length === 0}>
        <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-maroon text-ivory"><Plus className="h-5 w-5" aria-hidden="true" /></span>
          <span className="text-xl text-maroon">Add a testimonial</span>
          <ChevronDown className="ml-auto h-5 w-5 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-sand p-5 sm:p-6">
          <AdminForm action={saveTestimonial} submitLabel="Add testimonial" resetOnSuccess>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Client name (or initials)" name="author_name"><input id="author_name" name="author_name" required maxLength={120} className="field" /></Field>
              <Field label="Detail (optional, e.g. city)" name="author_detail"><input id="author_detail" name="author_detail" maxLength={160} className="field" /></Field>
            </div>
            <Field label="Their words" name="quote"><textarea id="quote" name="quote" rows={4} required maxLength={2000} className="field" /></Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Rating 1–5 (optional)" name="rating"><input id="rating" name="rating" type="number" min={1} max={5} className="field" /></Field>
              <Field label="Where you verified it" name="source" hint="e.g. Google review, written note"><input id="source" name="source" maxLength={200} className="field" /></Field>
              <Field label="Order" name="sort_order" hint="Lower numbers show first."><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={100} className="field" /></Field>
            </div>
            <div className="space-y-3">
              <Check name="is_verified" label="Verified — this is a genuine client testimonial I may publish" />
              <Check name="is_published" label="Published on the website" hint="Requires Verified." />
            </div>
          </AdminForm>
        </div>
      </details>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter testimonials" className="flex flex-wrap gap-2">
          {FILTERS.map(([k, label]) => (
            <Link
              key={k}
              href={href(k)}
              aria-current={show === k ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
                show === k ? "border-maroon bg-maroon text-ivory" : "border-sand bg-white-warm text-charcoal hover:bg-parchment",
              )}
            >
              {label} <span className={cn("rounded-full px-1.5 text-xs", show === k ? "bg-white/20" : "bg-parchment text-ink-soft")}>{counts[k]}</span>
            </Link>
          ))}
        </nav>
        <form method="get" role="search" className="relative w-full sm:w-72">
          <input type="hidden" name="show" value={show} />
          <label htmlFor="tq" className="sr-only">Search testimonials</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input id="tq" name="q" defaultValue={q} placeholder="Search name or words" className="field !pl-9" />
        </form>
      </div>

      {all.length === 0 ? (
        <Empty>No testimonials. Nothing is shown on the site until you add and verify real ones.</Empty>
      ) : rows.length === 0 ? (
        <Empty>No testimonials match. <Link href="/admin/testimonials" className="font-semibold text-maroon underline">Clear filters</Link></Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-soft">Showing {rows.length} of {all.length}. Click a row to open and edit it.</p>
          <ul className="space-y-3">
            {rows.map((t) => (
              <li key={t.id}>
                <details className="group rounded-2xl border border-sand bg-white-warm shadow-card open:border-gold">
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-parchment/50 [&::-webkit-details-marker]:hidden sm:gap-4">
                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon to-saffron font-serif text-lg text-ivory">
                      {(t.author_name.trim()[0] ?? "•").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold text-charcoal">{t.author_name}</span>
                        {t.rating ? <span className="text-sm tracking-tight text-saffron" aria-label={`${t.rating} out of 5 stars`}>{"★".repeat(t.rating)}<span className="text-sand">{"★".repeat(5 - t.rating)}</span></span> : null}
                        {t.is_published ? <Badge tone="green">published</Badge> : <Badge tone="grey">hidden</Badge>}
                        {!t.is_verified && <Badge tone="saffron">unverified</Badge>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-soft">{t.quote}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-ink-soft sm:block">#{t.sort_order}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>

                  <div className="space-y-5 border-t border-sand p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-parchment/60 p-3">
                      <p className="flex-1 text-sm text-charcoal">
                        {t.is_published ? "This testimonial is shown on the website." : "This testimonial is hidden from the website."}
                      </p>
                      <AdminForm action={setTestimonialPublished} submitLabel={t.is_published ? "Hide from website" : "Show on website"} className="shrink-0">
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="publish" value={t.is_published ? "hide" : "publish"} />
                      </AdminForm>
                    </div>

                    <AdminForm action={saveTestimonial} submitLabel="Save changes">
                      <input type="hidden" name="id" value={t.id} />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Client name" name={`n_${t.id}`}><input id={`n_${t.id}`} name="author_name" required defaultValue={t.author_name} className="field" /></Field>
                        <Field label="Detail" name={`d_${t.id}`}><input id={`d_${t.id}`} name="author_detail" defaultValue={t.author_detail ?? ""} className="field" /></Field>
                      </div>
                      <Field label="Their words" name={`q_${t.id}`}><textarea id={`q_${t.id}`} name="quote" rows={4} required defaultValue={t.quote} className="field" /></Field>
                      <div className="grid gap-5 sm:grid-cols-3">
                        <Field label="Rating" name={`r_${t.id}`}><input id={`r_${t.id}`} name="rating" type="number" min={1} max={5} defaultValue={t.rating ?? ""} className="field" /></Field>
                        <Field label="Verified via" name={`s_${t.id}`}><input id={`s_${t.id}`} name="source" defaultValue={t.source ?? ""} className="field" /></Field>
                        <Field label="Order" name={`o_${t.id}`}><input id={`o_${t.id}`} name="sort_order" type="number" min={0} defaultValue={t.sort_order} className="field" /></Field>
                      </div>
                      <div className="flex flex-wrap gap-x-8 gap-y-3">
                        <Check name="is_verified" label="Verified" defaultChecked={t.is_verified} />
                        <Check name="is_published" label="Published" defaultChecked={t.is_published} />
                      </div>
                    </AdminForm>

                    <div className="border-t border-sand pt-4">
                      <AdminForm action={deleteTestimonial} submitLabel="Delete this testimonial" danger confirmMessage="Delete this testimonial? This cannot be undone.">
                        <input type="hidden" name="id" value={t.id} />
                      </AdminForm>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
