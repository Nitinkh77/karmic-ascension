import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { LEAD_COLUMNS, leadsToCsv, parseLeadFilters } from "@/lib/leads";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /admin/leads/export?status=&q=&source= → CSV of the filtered leads. Admin only (checked here, and again by RLS). */
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Not authorised", { status: 401 });

  const sp: Record<string, string> = {};
  new URL(req.url).searchParams.forEach((v, k) => (sp[k] = v));
  const f = parseLeadFilters(sp);

  let q = admin.supabase.from("leads").select(LEAD_COLUMNS).order("created_at", { ascending: false }).limit(5000);
  if (f.status) q = q.eq("status", f.status);
  if (f.source) q = q.eq("source", f.source);
  if (f.q) {
    const term = f.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,message.ilike.%${term}%`);
  }
  const [{ data, error }, { data: services }] = await Promise.all([q, admin.supabase.from("services").select("id, title")]);
  if (error) return new NextResponse("Could not export leads.", { status: 500 });

  const titles = new Map<string, string>();
  for (const s of services ?? []) titles.set(String(s.id), String(s.title));
  const rows = ((data ?? []) as unknown as Lead[]).map((l) => ({ ...l, service_title: l.service_id ? (titles.get(l.service_id) ?? null) : null }));

  return new NextResponse(leadsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
