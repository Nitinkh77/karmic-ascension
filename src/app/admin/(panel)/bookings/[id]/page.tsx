import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, History as HistoryIcon, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Card, Field, PageTitle } from "@/components/admin/ui";
import { FollowUpFields } from "@/components/admin/FollowUpFields";
import { WhatsAppActions } from "@/components/admin/WhatsAppActions";
import { rescheduleBooking, saveBookingNotes, saveCaseRecord, saveFollowUp, setBookingStatus, setPaymentStatus } from "@/app/admin/(panel)/actions";
import { BOOKING_DETAIL_COLUMNS } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst, istDateString } from "@/lib/booking/slots";
import type { Booking, SiteSettings } from "@/lib/types";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { waNumber } from "@/lib/whatsapp-templates";

export const metadata = { title: "Booking" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statusTone = { pending: "saffron", confirmed: "green", cancelled: "grey", completed: "maroon" } as const;
const payTone = { unpaid: "red", pending_verification: "saffron", paid: "green", refunded: "grey", waived: "grey" } as const;
const day = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

type HistoryRow = { id: string; public_code: string; service_title: string; starts_at: string; status: keyof typeof statusTone; payment_status: keyof typeof payTone; service_price_paise: number | null; currency: string };

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();

  // The detail query includes the private case record. If the latest migration has not been run yet,
  // fall back to the basic columns so the page still opens.
  let res = await supabase.from("bookings").select(BOOKING_DETAIL_COLUMNS).eq("id", id).maybeSingle();
  let migrated = true;
  if (res.error) {
    migrated = false;
    res = await supabase.from("bookings").select(BOOKING_DETAIL_COLUMNS.split(", case_lagna")[0]).eq("id", id).maybeSingle();
  }
  if (!res.data) notFound();
  const b = res.data as unknown as Booking;

  const escEmail = b.customer_email.replace(/[\\%_]/g, "\\$&");
  const [{ data: events }, { data: payments }, { data: hist }, { data: st }] = await Promise.all([
    supabase.from("booking_events").select("id, event_type, from_value, to_value, note, created_at").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, provider, amount_paise, currency, status, reference, created_at").eq("booking_id", id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, public_code, service_title, starts_at, status, payment_status, service_price_paise, currency").ilike("customer_email", escEmail).order("starts_at", { ascending: false }).limit(200),
    supabase.from("site_settings").select("google_review_url, paytm_phonepe_number, gpay_upi_id, payment_instructions").eq("id", 1).maybeSingle(),
  ]);
  const settings = (st ?? {}) as Partial<SiteSettings>;

  // Client history: everything this customer (same e-mail) has booked.
  const history = (hist ?? []) as unknown as HistoryRow[];
  const live = history.filter((h) => h.status !== "cancelled");
  const completedCount = history.filter((h) => h.status === "completed").length;
  const lifetimePaise = history.filter((h) => h.payment_status === "paid").reduce((s, h) => s + (h.service_price_paise ?? 0), 0);
  const firstSeen = live.length ? live[live.length - 1].starts_at : null;
  const others = history.filter((h) => h.id !== b.id);

  const wa = whatsappLink(waNumber(b.customer_phone), `Namaste ${b.customer_name}, regarding your booking ${b.public_code}.`);
  const istDate = istDateString(new Date(b.starts_at));
  const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(b.starts_at));
  const today = istDateString(new Date());
  const followDue = Boolean(b.follow_up_on && !b.follow_up_done && b.follow_up_on <= today);
  const payment = [settings.paytm_phonepe_number && `Paytm / PhonePe: ${settings.paytm_phonepe_number}`, settings.gpay_upi_id && `GPay UPI: ${settings.gpay_upi_id}`, settings.payment_instructions].filter(Boolean).join("\n");

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All bookings
      </Link>
      <PageTitle title={b.customer_name} description={`${b.service_title} · ${formatDateTimeIst(b.starts_at)} IST`}>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[b.status]}>{b.status}</Badge>
          <Badge tone={payTone[b.payment_status]}>{b.payment_status.replace("_", " ")}</Badge>
          {followDue && <Badge tone="red">follow-up due</Badge>}
        </div>
      </PageTitle>

      {!migrated && (
        <p role="alert" className="mb-6 rounded-xl border border-saffron/50 bg-saffron-soft p-4 text-sm">
          Case notes, follow-ups and review tracking need one database update. In Supabase → SQL Editor, run <code>supabase/migrations/20261029000009_crm_notifications.sql</code>, then refresh this page.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-xl text-maroon">Booking details</h2>
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
              {wa && <a className="font-semibold text-maroon underline" href={wa} target="_blank" rel="noopener noreferrer">Open WhatsApp chat<span className="sr-only"> (opens in a new tab)</span></a>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-xl text-maroon">Message the customer</h2>
            <p className="mb-4 text-sm text-ink-soft">Opens WhatsApp with the message already written. Nothing is sent until you press Send there.</p>
            <WhatsAppActions
              bookingId={b.id}
              phone={b.customer_phone}
              ctx={{ name: b.customer_name, service: b.service_title, when: `${formatDateTimeIst(b.starts_at)}`, code: b.public_code, reviewUrl: settings.google_review_url ?? null, payment: payment || null }}
              completed={b.status === "completed"}
              reviewRequestedAt={b.review_requested_at ?? null}
            />
          </Card>

          <Card>
            <div className="mb-1 flex items-center gap-2"><NotebookPen className="h-5 w-5 text-gold-deep" aria-hidden="true" /><h2 className="text-xl text-maroon">Case record &amp; remedies</h2></div>
            <p className="mb-4 text-sm text-ink-soft">Private. Only admins can see this; it is never shown to the customer.</p>
            <AdminForm action={saveCaseRecord} submitLabel="Save case record">
              <input type="hidden" name="id" value={b.id} />
              <h3 className="text-lg text-maroon">Chart observations</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Lagna" name="case_lagna"><input id="case_lagna" name="case_lagna" defaultValue={b.case_lagna ?? ""} maxLength={120} className="field" placeholder="e.g. Kanya" /></Field>
                <Field label="Rashi (Moon sign)" name="case_rashi"><input id="case_rashi" name="case_rashi" defaultValue={b.case_rashi ?? ""} maxLength={120} className="field" placeholder="e.g. Karka" /></Field>
                <Field label="Running dasha" name="case_dasha"><input id="case_dasha" name="case_dasha" defaultValue={b.case_dasha ?? ""} maxLength={160} className="field" placeholder="e.g. Shani – Budh" /></Field>
              </div>
              <Field label="Observations" name="case_observations"><textarea id="case_observations" name="case_observations" rows={4} defaultValue={b.case_observations ?? ""} maxLength={4000} className="field" /></Field>
              <Field label="Pending karma identified" name="case_pending_karma"><textarea id="case_pending_karma" name="case_pending_karma" rows={3} defaultValue={b.case_pending_karma ?? ""} maxLength={4000} className="field" /></Field>
              <h3 className="pt-2 text-lg text-maroon">Remedies prescribed</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gemstones" name="remedy_gemstones"><textarea id="remedy_gemstones" name="remedy_gemstones" rows={2} defaultValue={b.remedy_gemstones ?? ""} maxLength={1500} className="field" /></Field>
                <Field label="Mantras" name="remedy_mantras"><textarea id="remedy_mantras" name="remedy_mantras" rows={2} defaultValue={b.remedy_mantras ?? ""} maxLength={1500} className="field" /></Field>
                <Field label="Fasts" name="remedy_fasts"><textarea id="remedy_fasts" name="remedy_fasts" rows={2} defaultValue={b.remedy_fasts ?? ""} maxLength={1500} className="field" /></Field>
                <Field label="Donations" name="remedy_donations"><textarea id="remedy_donations" name="remedy_donations" rows={2} defaultValue={b.remedy_donations ?? ""} maxLength={1500} className="field" /></Field>
              </div>
            </AdminForm>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl text-maroon">Client history</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Bookings", String(live.length)],
                ["Sessions completed", String(completedCount)],
                ["Lifetime value", formatPrice(lifetimePaise, "INR") ?? "₹0"],
                ["Client since", firstSeen ? day(istDateString(new Date(firstSeen))) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-sand bg-parchment/50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{k}</dt>
                  <dd className="mt-1 font-serif text-2xl text-maroon">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-ink-soft">Matched by e-mail address. Lifetime value counts bookings you marked paid.</p>
            {others.length > 0 && (
              <ul className="mt-4 divide-y divide-sand rounded-xl border border-sand">
                {others.map((h) => (
                  <li key={h.id}>
                    <Link href={`/admin/bookings/${h.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm hover:bg-parchment">
                      <span className="min-w-0"><span className="block font-semibold text-charcoal">{h.service_title}</span><span className="text-ink-soft">{formatDateTimeIst(h.starts_at)}</span></span>
                      <span className="flex gap-2"><Badge tone={statusTone[h.status]}>{h.status}</Badge><Badge tone={payTone[h.payment_status]}>{h.payment_status.replace("_", " ")}</Badge></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <details className="group rounded-2xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xl text-maroon [&::-webkit-details-marker]:hidden">
              <HistoryIcon className="h-5 w-5 text-gold-deep" aria-hidden="true" /> Activity &amp; payments
              <span className="ml-auto text-sm font-sans text-ink-soft group-open:hidden">Show</span>
            </summary>
            <div className="mt-4">
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
            </div>
          </details>
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
            <div className="mb-3 flex items-center gap-2"><CalendarClock className="h-5 w-5 text-gold-deep" aria-hidden="true" /><h2 className="text-xl text-maroon">Follow-up reminder</h2></div>
            {b.follow_up_on && (
              <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${followDue ? "bg-red-50 text-danger" : "bg-parchment text-charcoal"}`}>
                {b.follow_up_done ? "Done" : followDue ? "Due now" : "Planned"}: {day(b.follow_up_on)}
              </p>
            )}
            <AdminForm action={saveFollowUp} submitLabel="Save follow-up">
              <input type="hidden" name="id" value={b.id} />
              <FollowUpFields defaultDate={b.follow_up_on ?? null} defaultDone={b.follow_up_done ?? false} />
            </AdminForm>
            <p className="mt-2 text-xs text-ink-soft">Due follow-ups show on your dashboard and in Bookings → Follow-ups due.</p>
          </Card>

          <details className="group rounded-2xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xl text-maroon [&::-webkit-details-marker]:hidden">
              Reschedule <span className="text-sm font-sans text-ink-soft group-open:hidden">Show</span>
            </summary>
            <div className="mt-3">
              <AdminForm action={rescheduleBooking} submitLabel="Reschedule">
                <input type="hidden" name="id" value={b.id} />
                <Field label="New date (IST)" name="date"><input id="date" name="date" type="date" defaultValue={istDate} className="field" /></Field>
                <Field label="New time (IST)" name="time"><input id="time" name="time" type="time" defaultValue={istTime} className="field" /></Field>
              </AdminForm>
              <p className="mt-2 text-xs text-ink-soft">Overlaps with other bookings are rejected automatically.</p>
            </div>
          </details>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Quick notes</h2>
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
