import Link from "next/link";
import { Badge, buttonStyles } from "@/components/ui";
import { Empty, PageTitle } from "@/components/admin/ui";
import { BOOKING_COLUMNS, parseBookingFilters } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst, istToDate, addDays } from "@/lib/booking/slots";
import type { Booking } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Bookings" };

const statusTone = { pending: "saffron", confirmed: "green", cancelled: "grey", completed: "maroon" } as const;
const payTone = { unpaid: "red", pending_verification: "saffron", paid: "green", refunded: "grey", waived: "grey" } as const;

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAdmin();
  const f = parseBookingFilters(await searchParams);

  let q = supabase.from("bookings").select(BOOKING_COLUMNS, { count: "exact" }).order("starts_at", { ascending: false }).limit(100);
  if (f.status) q = q.eq("status", f.status);
  if (f.payment) q = q.eq("payment_status", f.payment);
  if (f.service) q = q.eq("service_id", f.service);
  if (f.from) q = q.gte("starts_at", istToDate(f.from, "00:00").toISOString());
  if (f.to) q = q.lt("starts_at", istToDate(addDays(f.to, 1), "00:00").toISOString());
  if (f.q) {
    // Strip characters that have meaning in PostgREST filter syntax before interpolating.
    const term = f.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) q = q.or(`customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,customer_phone.ilike.%${term}%,public_code.ilike.%${term}%`);
  }

  const [{ data, count, error }, { data: services }] = await Promise.all([
    q,
    supabase.from("services").select("id, title").order("title"),
  ]);
  const rows = (data ?? []) as unknown as Booking[];

  return (
    <>
      <PageTitle title="Bookings" description="Search, filter and manage consultation bookings." />

      <form method="get" className="mb-6 grid gap-3 rounded-2xl border border-sand bg-white-warm p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs font-semibold">Search</label>
          <input id="q" name="q" defaultValue={f.q} placeholder="Name, email, phone, reference" className="field" />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-semibold">Status</label>
          <select id="status" name="status" defaultValue={f.status} className="field">
            <option value="">All</option>
            {["pending", "confirmed", "cancelled", "completed"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="payment" className="mb-1 block text-xs font-semibold">Payment</label>
          <select id="payment" name="payment" defaultValue={f.payment} className="field">
            <option value="">All</option>
            {["unpaid", "pending_verification", "paid", "refunded", "waived"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="service" className="mb-1 block text-xs font-semibold">Service</label>
          <select id="service" name="service" defaultValue={f.service} className="field">
            <option value="">All</option>
            {(services ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="mb-1 block text-xs font-semibold">From (IST)</label>
          <input id="from" name="from" type="date" defaultValue={f.from} className="field" />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-xs font-semibold">To (IST)</label>
          <input id="to" name="to" type="date" defaultValue={f.to} className="field" />
        </div>
        <div className="flex items-end gap-2 lg:col-span-2">
          <button type="submit" className={buttonStyles("primary", "md")}>Apply filters</button>
          <Link href="/admin/bookings" className={buttonStyles("secondary", "md")}>Reset</Link>
        </div>
      </form>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">Could not load bookings.</p>
      ) : rows.length === 0 ? (
        <Empty>No bookings match. {Object.values(f).some(Boolean) ? "Try clearing the filters." : "New bookings will appear here."}</Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-soft">Showing {rows.length}{count && count > rows.length ? ` of ${count}` : ""} bookings</p>
          <div className="overflow-x-auto rounded-2xl border border-sand bg-white-warm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Bookings</caption>
              <thead className="border-b border-sand bg-parchment text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="p-3">When (IST)</th>
                  <th scope="col" className="p-3">Customer</th>
                  <th scope="col" className="p-3">Service</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory">
                    <td className="p-3 whitespace-nowrap">
                      <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-maroon underline-offset-2 hover:underline">
                        {formatDateTimeIst(b.starts_at)}
                      </Link>
                      <span className="block font-mono text-xs text-ink-soft">{b.public_code}</span>
                    </td>
                    <td className="p-3">{b.customer_name}<span className="block text-xs text-ink-soft">{b.customer_phone}</span></td>
                    <td className="p-3">{b.service_title}<span className="block text-xs text-ink-soft">{formatPrice(b.service_price_paise, b.currency) ?? "Price on request"}</span></td>
                    <td className="p-3"><Badge tone={statusTone[b.status]}>{b.status}</Badge></td>
                    <td className="p-3"><Badge tone={payTone[b.payment_status]}>{b.payment_status.replace("_", " ")}</Badge></td>
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
