import Link from "next/link";
import { Badge } from "@/components/ui";
import { Card, Empty, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst } from "@/lib/booking/slots";

export const metadata = { title: "Dashboard" };

const statusTone = { pending: "saffron", confirmed: "green", cancelled: "grey", completed: "maroon" } as const;

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const nowIso = new Date().toISOString();

  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [total, pending, confirmed, awaitingPayment, upcoming, recent, services, newLeads] = await Promise.all([
    count(supabase.from("bookings").select("id", { count: "exact", head: true })),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed")),
    count(
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"])
        .in("payment_status", ["unpaid", "pending_verification"]),
    ),
    supabase
      .from("bookings")
      .select("id, public_code, customer_name, service_title, starts_at, status, payment_status")
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", nowIso)
      .order("starts_at")
      .limit(6),
    supabase
      .from("booking_events")
      .select("id, booking_id, event_type, from_value, to_value, created_at, bookings(public_code, customer_name)")
      .order("created_at", { ascending: false })
      .limit(8),
    count(supabase.from("services").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new")),
  ]);

  const stats: Array<{ label: string; value: number; href?: string }> = [
    { label: "All bookings", value: total },
    { label: "Pending", value: pending },
    { label: "Confirmed", value: confirmed },
    { label: "Awaiting payment", value: awaitingPayment },
    { label: "New leads", value: newLeads, href: "/admin/leads?status=new" },
  ];

  return (
    <>
      <PageTitle title="Dashboard" description="Live figures from your bookings database." />
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <dt className="eyebrow">{s.href ? <Link href={s.href} className="hover:underline">{s.label}</Link> : s.label}</dt>
            <dd className="mt-2 font-serif text-4xl text-maroon">{s.value}</dd>
          </Card>
        ))}
      </dl>

      {services === 0 && (
        <p className="mt-6 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm">
          No services are published yet, so visitors cannot book. <Link href="/admin/services" className="font-semibold underline">Publish a service</Link>.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="up-h">
          <h2 id="up-h" className="mb-3 text-2xl text-maroon">Upcoming appointments</h2>
          {!upcoming.data?.length ? (
            <Empty>No upcoming pending or confirmed appointments.</Empty>
          ) : (
            <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white-warm">
              {upcoming.data.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-parchment">
                    <span>
                      <span className="block font-semibold text-charcoal">{b.customer_name}</span>
                      <span className="block text-sm text-ink-soft">
                        {b.service_title} · {formatDateTimeIst(b.starts_at)}
                      </span>
                    </span>
                    <Badge tone={statusTone[b.status as keyof typeof statusTone]}>{b.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="act-h">
          <h2 id="act-h" className="mb-3 text-2xl text-maroon">Recent activity</h2>
          {!recent.data?.length ? (
            <Empty>No activity yet. New bookings and status changes appear here.</Empty>
          ) : (
            <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white-warm">
              {recent.data.map((e) => {
                const raw = e.bookings as unknown;
                const bk = (Array.isArray(raw) ? raw[0] : raw) as { public_code: string; customer_name: string } | null;
                return (
                  <li key={e.id}>
                    <Link href={`/admin/bookings/${e.booking_id}`} className="block p-4 hover:bg-parchment">
                      <span className="block text-sm text-charcoal">
                        <span className="font-semibold">{bk?.customer_name ?? "Booking"}</span>{" "}
                        {e.event_type === "created" && "made a booking request"}
                        {e.event_type === "status" && `· status ${e.from_value} → ${e.to_value}`}
                        {e.event_type === "payment" && `· payment ${e.from_value} → ${e.to_value}`}
                        {e.event_type === "rescheduled" && "· rescheduled"}
                        {e.event_type === "note" && "· note updated"}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {bk?.public_code} · {formatDateTimeIst(e.created_at)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
