import Link from "next/link";
import { Download } from "lucide-react";
import { Badge, buttonStyles } from "@/components/ui";
import { Empty, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst } from "@/lib/booking/slots";
import { LEAD_COLUMNS, leadTone, parseLeadFilters, sourceLabel } from "@/lib/leads";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/validation";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAdmin();
  const f = parseLeadFilters(await searchParams);

  let q = supabase.from("leads").select(LEAD_COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).limit(200);
  if (f.status) q = q.eq("status", f.status);
  if (f.source) q = q.eq("source", f.source);
  if (f.q) {
    const term = f.q.replace(/[%,()*\\]/g, " ").trim(); // characters with meaning in PostgREST filters
    if (term) q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,message.ilike.%${term}%`);
  }

  const [{ data, count, error }, { data: services }, { data: sources }] = await Promise.all([
    q,
    supabase.from("services").select("id, title"),
    supabase.from("leads").select("source").limit(1000),
  ]);
  const rows = (data ?? []) as unknown as Lead[];
  const titles = new Map<string, string>();
  for (const s of services ?? []) titles.set(String(s.id), String(s.title));
  const sourceList: string[] = [...new Set<string>((sources ?? []).map((r) => String(r.source)))].sort();
  const exportQs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();

  return (
    <>
      <PageTitle title="Leads" description="Enquiries from the website. Follow up, track status and keep notes.">
        <a href={`/admin/leads/export${exportQs ? `?${exportQs}` : ""}`} className={buttonStyles("secondary", "md")}>
          <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
        </a>
      </PageTitle>

      <form method="get" className="mb-6 grid gap-3 rounded-2xl border border-sand bg-white-warm p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs font-semibold">Search</label>
          <input id="q" name="q" defaultValue={f.q} placeholder="Name, phone, email, message" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-semibold">Status</label>
          <select id="status" name="status" defaultValue={f.status} className="field">
            <option value="">All</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="source" className="mb-1 block text-xs font-semibold">Source</label>
          <select id="source" name="source" defaultValue={f.source} className="field">
            <option value="">All</option>
            {sourceList.map((s) => <option key={s} value={s}>{sourceLabel(s)}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className={buttonStyles("primary", "md")}>Apply</button>
          <Link href="/admin/leads" className={buttonStyles("secondary", "md")}>Reset</Link>
        </div>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">
          Could not load leads. If you have not yet run <code>supabase/migrations/20261024000006_leads.sql</code>, run it in the Supabase SQL Editor.
        </p>
      ) : rows.length === 0 ? (
        <Empty>No leads match. {Object.values(f).some(Boolean) ? "Try clearing the filters." : "Enquiries sent from the Contact and Service pages appear here."}</Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-soft">Showing {rows.length}{count && count > rows.length ? ` of ${count}` : ""} leads</p>
          <ul className="space-y-3 md:hidden" aria-label="Leads">
            {rows.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="block rounded-2xl border border-sand bg-white-warm p-4 hover:bg-ivory">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 break-words font-semibold text-maroon">{l.name}</span>
                    <Badge tone={leadTone[l.status]}>{l.status}</Badge>
                  </span>
                  <span className="mt-1 block break-words text-sm text-ink-soft">{[l.phone, l.email].filter(Boolean).join(" · ")}</span>
                  <span className="mt-2 block break-words text-sm">{l.service_id ? (titles.get(l.service_id) ?? "—") : "General enquiry"} · {sourceLabel(l.source)}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{formatDateTimeIst(l.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl md:block border border-sand bg-white-warm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Leads</caption>
              <thead className="border-b border-sand bg-parchment text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="p-3">Received (IST)</th>
                  <th scope="col" className="p-3">Lead</th>
                  <th scope="col" className="p-3">Interested in</th>
                  <th scope="col" className="p-3">Source</th>
                  <th scope="col" className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-ivory">
                    <td className="p-3 whitespace-nowrap">
                      <Link href={`/admin/leads/${l.id}`} className="font-semibold text-maroon underline-offset-2 hover:underline">
                        {formatDateTimeIst(l.created_at)}
                      </Link>
                    </td>
                    <td className="p-3">
                      {l.name}
                      <span className="block text-xs text-ink-soft">{[l.phone, l.email].filter(Boolean).join(" · ")}</span>
                    </td>
                    <td className="p-3">{l.service_id ? (titles.get(l.service_id) ?? "—") : "—"}</td>
                    <td className="p-3">{sourceLabel(l.source)}</td>
                    <td className="p-3"><Badge tone={leadTone[l.status]}>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
