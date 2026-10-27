import Link from "next/link";
import { Card, Empty, PageTitle } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sourceLabel } from "@/lib/leads";
import { cn, formatPrice } from "@/lib/utils";

export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90] as const;
const IST_MS = 5.5 * 3600_000;
const istDay = (iso: string) => new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 10);

type B = { created_at: string; status: string; payment_status: string; service_title: string; service_price_paise: number | null };
type L = { created_at: string; source: string | null; status: string };

function tally<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { supabase } = await requireAdmin();
  const asked = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(asked) ? asked : 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [bk, ld, cu] = await Promise.all([
    supabase.from("bookings").select("created_at, status, payment_status, service_title, service_price_paise").gte("created_at", since).limit(5000),
    supabase.from("leads").select("created_at, source, status").gte("created_at", since).limit(5000),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", since),
  ]);
  const bookings = (bk.data ?? []) as B[];
  const leads = (ld.data ?? []) as L[];
  const signups = cu.count ?? 0;

  const active = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const received = bookings.filter((b) => b.payment_status === "paid").reduce((s, b) => s + (b.service_price_paise ?? 0), 0);
  const awaiting = bookings.filter((b) => (b.status === "pending" || b.status === "confirmed") && (b.payment_status === "unpaid" || b.payment_status === "pending_verification")).length;

  // One bar per IST day, oldest first.
  const perDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) perDay.set(istDay(new Date(Date.now() - i * 86400_000).toISOString()), 0);
  for (const b of bookings) {
    const d = istDay(b.created_at);
    if (perDay.has(d)) perDay.set(d, (perDay.get(d) ?? 0) + 1);
  }
  const series = [...perDay.entries()];
  const peak = Math.max(1, ...series.map(([, n]) => n));

  const topServices = tally(bookings, (b) => b.service_title).slice(0, 6);
  const sources = tally(leads, (l) => l.source || "unknown").slice(0, 6);
  const statuses = tally(bookings, (b) => b.status);

  const kpis = [
    { label: "Bookings", value: String(bookings.length), note: `${active.length} confirmed or completed` },
    { label: "Payments received", value: formatPrice(received) ?? "₹0", note: "Bookings marked paid" },
    { label: "Awaiting payment", value: String(awaiting), note: "Open bookings not yet paid" },
    { label: "Enquiries (leads)", value: String(leads.length), note: `${leads.filter((l) => l.status === "new").length} still new` },
    { label: "New sign-ups", value: String(signups), note: "Customer accounts" },
  ];

  return (
    <>
      <PageTitle title="Analytics" description={`What happened in the last ${days} days. Figures come straight from your database.`}>
        <nav aria-label="Time range" className="flex gap-2">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin/analytics?days=${r}`} aria-current={r === days ? "page" : undefined} className={cn(buttonStyles(r === days ? "primary" : "secondary", "sm"))}>
              {r} days
            </Link>
          ))}
        </nav>
      </PageTitle>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <dt className="eyebrow">{k.label}</dt>
            <dd className="mt-2 font-serif text-3xl text-maroon sm:text-4xl">{k.value}</dd>
            <p className="mt-1 text-xs text-ink-soft">{k.note}</p>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="perday" className="mt-8">
        <h2 id="perday" className="mb-3 text-2xl text-maroon">Bookings per day</h2>
        <Card>
          {bookings.length === 0 ? (
            <Empty>No bookings in this period yet.</Empty>
          ) : (
            <>
              <div className="flex h-40 items-end gap-[2px] sm:gap-1" role="img" aria-label={`Bookings per day for the last ${days} days. Busiest day had ${peak}.`}>
                {series.map(([d, n]) => (
                  <div key={d} className="group relative flex h-full flex-1 items-end">
                    <div className="w-full rounded-t bg-maroon/80 transition-colors group-hover:bg-saffron" style={{ height: `${Math.max(n ? 6 : 1, (n / peak) * 100)}%` }} title={`${d}: ${n}`} />
                  </div>
                ))}
              </div>
              <p className="mt-2 flex justify-between text-xs text-ink-soft">
                <span>{series[0]?.[0]}</span>
                <span>Busiest day: {peak}</span>
                <span>{series[series.length - 1]?.[0]}</span>
              </p>
            </>
          )}
        </Card>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <RankCard title="Most booked consultations" rows={topServices} empty="No bookings yet." />
        <RankCard title="Booking status" rows={statuses} empty="No bookings yet." />
        <RankCard title="Where enquiries come from" rows={sources.map(([k, n]) => [sourceLabel(k), n] as [string, number])} empty="No enquiries yet." />
      </div>
      <p className="mt-6 text-xs text-ink-soft">
        “Payments received” adds up bookings you have marked as paid. It is not a bank statement. Days follow Indian time (IST).
      </p>
    </>
  );
}

function RankCard({ title, rows, empty }: { title: string; rows: Array<[string, number]>; empty: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <Card>
      <h2 className="text-xl text-maroon">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map(([label, n]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 break-words">{label}</span>
                <span className="font-semibold text-maroon">{n}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-parchment"><div className="h-full rounded-full bg-gold" style={{ width: `${(n / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
