import Link from "next/link";
import { Badge } from "@/components/ui";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_PAGES } from "@/lib/defaults";

export const metadata = { title: "Website content" };

export default async function ContentIndexPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("pages").select("slug, is_published, is_draft");
  const db = new Map<string, { is_published: boolean; is_draft: boolean }>();
  for (const p of data ?? []) db.set(p.slug, p);

  return (
    <>
      <PageTitle title="Website content" description="Edit the wording of each page. Footer and contact details are in Settings." />
      <ul className="divide-y divide-sand overflow-hidden rounded-2xl border border-sand bg-white-warm">
        {DEFAULT_PAGES.map((p) => {
          const row = db.get(p.slug);
          return (
            <li key={p.slug}>
              <Link href={`/admin/content/${p.slug}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-parchment">
                <span>
                  <span className="block font-semibold text-charcoal">{p.title}</span>
                  <span className="block text-sm text-ink-soft">/{p.slug === "home" ? "" : p.slug}</span>
                </span>
                <span className="flex gap-2">
                  {!row && <Badge tone="grey">using built-in text</Badge>}
                  {row && !row.is_published && <Badge tone="red">unpublished</Badge>}
                  {(row?.is_draft ?? p.draft) && <Badge tone="saffron">draft — needs review</Badge>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
