import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Card, Field, PageTitle } from "@/components/admin/ui";
import { rescheduleBooking, saveBookingNotes, setBookingStatus, setPaymentStatus } from "@/app/admin/(panel)/actions";
import { BOOKING_COLUMNS } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst, istDateString } from "@/lib/booking/slots";
import type { Booking } from "@/lib/types";
import { formatPrice, whatsappLink } from "@/lib/utils";

export const metadata = { title: "Booking" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const [{ data }, { data: events }, { data: payments }] = await Promise.all([
    supabase.from("bookings").select(BOOKING_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("booking_events").select("id, event_type, from_value, to_value, note, created_at").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, provider, amount_paise, currency, status, reference, created_at").eq("booking_id", id).order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const b = data as unknown as Booking;
  const wa = whatsappLink(b.customer_phone.replace(/\D/g, ""), `Namaste ${b.customer_name}, regarding your booking ${b.public_code}.`);
  const istDate = istDateString(new Date(b.starts_at));
  const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(b.starts_at));

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All bookings
      </Link>
      <PageTitle title={b.customer_name} description={`${b.service_title} · ${formatDateTimeIst(b.starts_at)} IST`}>
        <div className="flex gap-2"><Badge tone="maroon">{b.status}</Badge><Badge tone="saffron">{b.payment_status.replace("_", " ")}</Badge></div>
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl text-maroon">Details</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm [overflow-wrap:anywhere] sm:grid-cols-2 [&>div]:min-w-0">
              {[
                ["Reference", b.public_code],
                ["Service (as booked)", b.service_title],
                ["Price (as booked)", formatPrice(b.service_price_paise, b.currency) ?? "Price on request"],
                ["Duration", `${b.duration_minutes} min`],
                ["Email", b.customer_email],
                ["Phone", b.customer_phone],
                ["Date of birth", b.birth_date ?? "—"],
                ["Time of birth", b.birth_time ?? "—"],
                ["Place of birth", b.birth_place ?? "—"],
                ["Booked on", formatDateTimeIst(b.created_at)],
              ].map(([k, v]) => (
                <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-0.5 break-words text-charcoal">{v}</dd></div>
              ))}
            </dl>
            {b.customer_notes && (
              <div className="mt-4 rounded-lg bg-parchment p-3 text-sm"><p className="eyebrow mb-1">Customer note</p><p className="whitespace-pre-line">{b.customer_notes}</p></div>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a className="font-semibold text-maroon underline" href={`mailto:${b.customer_email}`}>Email customer</a>
              {wa && <a className="font-semibold text-maroon underline" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp customer<span className="sr-only"> (opens in a new tab)</span></a>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl text-maroon">History</h2>
            {!events?.length ? <p className="text-sm text-ink-soft">No events yet.</p> : (
              <ol className="space-y-2 text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-sand pb-2 last:border-0">
                    <span>
                      {e.event_type === "created" && "Booking created"}
                      {e.event_type === "status" && `Status: ${e.from_value} → ${e.to_value}`}
                      {e.event_type === "payment" && `Payment: ${e.from_value} → ${e.to_value}`}
                      {e.event_type === "rescheduled" && "Rescheduled"}
                      {e.event_type === "note" && "Admin note updated"}
                    </span>
                    <time className="text-ink-soft" dateTime={e.created_at}>{formatDateTimeIst(e.created_at)}</time>
                  </li>
                ))}
              </ol>
            )}
            {payments && payments.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 text-lg text-maroon">Payment records</h3>
                <ul className="space-y-1 text-sm">
                  {payments.map((p) => (
                    <li key={p.id}>{p.provider} · {formatPrice(p.amount_paise, p.currency)} · {p.status}{p.reference ? ` · ref ${p.reference}` : ""}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-3 text-xl text-maroon">Booking status</h2>
            <AdminForm action={setBookingStatus} submitLabel="Update status">
              <input type="hidden" name="id" value={b.id} />
              <Field label="Status" name="status">
                <select id="status" name="status" defaultValue={b.status} className="field">
                  {["pending", "confirmed", "cancelled", "completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </AdminForm>
            <p className="mt-2 text-xs text-ink-soft">Cancelling frees the time slot. Re-opening checks for clashes.</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Payment</h2>
            <AdminForm action={setPaymentStatus} submitLabel="Update payment">
              <input type="hidden" name="id" value={b.id} />
              <Field label="Payment status" name="payment_status">
                <select id="payment_status" name="payment_status" defaultValue={b.payment_status} className="field">
                  {["unpaid", "pending_verification", "paid", "refunded", "waived"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Payment reference (UPI txn id, optional)" name="reference">
                <input id="reference" name="reference" className="field" maxLength={200} />
              </Field>
            </AdminForm>
            <p className="mt-2 text-xs text-ink-soft">Only you can mark a booking paid. Customers cannot.</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Reschedule</h2>
            <AdminForm action={rescheduleBooking} submitLabel="Reschedule">
              <input type="hidden" name="id" value={b.id} />
              <Field label="New date (IST)" name="date"><input id="date" name="date" type="date" defaultValue={istDate} className="field" /></Field>
              <Field label="New time (IST)" name="time"><input id="time" name="time" type="time" defaultValue={istTime} className="field" /></Field>
            </AdminForm>
            <p className="mt-2 text-xs text-ink-soft">Overlaps with other bookings are rejected automatically.</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Private notes</h2>
            <AdminForm action={saveBookingNotes} submitLabel="Save note">
              <input type="hidden" name="id" value={b.id} />
              <Field label="Admin notes (never shown to customer)" name="admin_notes">
                <textarea id="admin_notes" name="admin_notes" rows={4} defaultValue={b.admin_notes ?? ""} className="field" maxLength={4000} />
              </Field>
            </AdminForm>
          </Card>
        </div>
      </div>
    </>
  );
}
