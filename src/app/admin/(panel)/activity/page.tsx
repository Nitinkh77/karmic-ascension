import Link from "next/link";
import { Empty, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst } from "@/lib/booking/slots";

export const metadata = { title: "Activity log" };

type Ev = {
  id: string;
  booking_id: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
  bookings: { public_code: string; customer_name: string } | { public_code: string; customer_name: string }[] | null;
};

const label = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Every change made to a booking (status, payment, notes), newest first. */
export default async function ActivityPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("booking_events")
    .select("id, booking_id, event_type, from_value, to_value, note, created_at, bookings(public_code, customer_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Ev[];

  return (
    <>
      <PageTitle title="Activity log" description="A record of every change to a booking: who it was, what changed and when. Latest 200." />
      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">Could not load the activity log.</p>
      ) : rows.length === 0 ? (
        <Empty>No activity yet. Changes to bookings appear here.</Empty>
      ) : (
        <ol className="space-y-3" aria-label="Activity">
          {rows.map((e) => {
            const b = Array.isArray(e.bookings) ? e.bookings[0] : e.bookings;
            return (
              <li key={e.id} className="rounded-2xl border border-sand bg-white-warm p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-maroon">
                    {label(e.event_type)}
                    {(e.from_value || e.to_value) && (
                      <span className="ml-2 font-normal text-charcoal">
                        {e.from_value ? <>{e.from_value} → </> : null}
                        <strong>{e.to_value ?? "—"}</strong>
                      </span>
                    )}
                  </p>
                  <time dateTime={e.created_at} className="text-xs text-ink-soft">{formatDateTimeIst(e.created_at)}</time>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  <Link href={`/admin/bookings/${e.booking_id}`} className="font-semibold text-maroon underline-offset-2 hover:underline">
                    {b?.public_code ?? "Booking"}
                  </Link>
                  {b?.customer_name ? ` · ${b.customer_name}` : ""}
                </p>
                {e.note && <p className="mt-2 break-words text-sm">{e.note}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
