import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, buttonStyles } from "@/components/ui";
import { Empty, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDuration, formatPrice } from "@/lib/utils";

export const metadata = { title: "Services & pricing" };

const tone = { published: "green", draft: "saffron", archived: "grey" } as const;

export default async function ServicesAdminPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, price_paise, currency, duration_minutes, status, is_featured, is_draft, sort_order")
    .order("sort_order")
    .order("title");

  return (
    <>
      <PageTitle title="Services & pricing" description="Prices are saved in rupees and stored as paise. Changing a price never alters existing bookings.">
        <Link href="/admin/services/new" className={buttonStyles("primary", "md")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New service
        </Link>
      </PageTitle>
      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">Could not load services.</p>
      ) : !data?.length ? (
        <Empty>No services yet. Create your first consultation to open booking.</Empty>
      ) : (
        <ul className="divide-y divide-sand overflow-hidden rounded-2xl border border-sand bg-white-warm">
          {data.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/services/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-parchment">
                <span>
                  <span className="block font-semibold text-charcoal">{s.title}</span>
                  <span className="block text-sm text-ink-soft">
                    {formatPrice(s.price_paise, s.currency) ?? "Price on request"} · {formatDuration(s.duration_minutes)} · /services/{s.slug}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  {s.is_draft && <Badge tone="saffron">needs review</Badge>}
                  {s.is_featured && <Badge tone="gold">featured</Badge>}
                  <Badge tone={tone[s.status as keyof typeof tone]}>{s.status}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
