import { AdminForm, Card, Empty, Field, PageTitle } from "@/components/admin/ui";
import { addBlockedDate, removeBlockedDate, saveSlotConfig, saveWeeklyHours } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDateIst, formatDateTimeIst, istDateString } from "@/lib/booking/slots";

export const metadata = { title: "Availability" };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (t: string) => t.slice(0, 5);

export default async function AvailabilityPage() {
  const { supabase } = await requireAdmin();
  const today = istDateString(new Date());
  const [{ data: rules }, { data: blocked }, { data: settings }, { data: booked }] = await Promise.all([
    supabase.from("availability_rules").select("weekday, start_time, end_time, is_active").order("weekday"),
    supabase.from("blocked_dates").select("id, blocked_on, start_time, end_time, reason").gte("blocked_on", today).order("blocked_on"),
    supabase.from("site_settings").select("slot_minutes, buffer_minutes, min_notice_hours, max_advance_days").eq("id", 1).maybeSingle(),
    supabase.from("bookings").select("id, customer_name, service_title, starts_at, status").in("status", ["pending", "confirmed"]).gte("starts_at", new Date().toISOString()).order("starts_at").limit(15),
  ]);
  const byDay = new Map<number, { weekday: number; start_time: string; end_time: string; is_active: boolean }>();
  for (const r of rules ?? []) byDay.set(r.weekday, r);
  const anyActive = (rules ?? []).some((r) => r.is_active);

  return (
    <>
      <PageTitle title="Availability" description="All times are Indian Standard Time (IST). Customers can only book inside these hours." />
      {!anyActive && (
        <p className="mb-6 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm">
          <strong>No working days are switched on</strong>, so nobody can book online yet. Tick the days you work below.
        </p>
      )}

      <Card>
        <h2 className="mb-4 text-xl text-maroon">Weekly working hours</h2>
        <AdminForm action={saveWeeklyHours} submitLabel="Save weekly hours">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">Weekly working hours</caption>
              <thead className="text-xs uppercase tracking-wide text-ink-soft">
                <tr><th scope="col" className="py-2">Day</th><th scope="col">Working</th><th scope="col">From</th><th scope="col">To</th></tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {DAYS.map((d, i) => {
                  const r = byDay.get(i);
                  return (
                    <tr key={d}>
                      <th scope="row" className="py-3 font-semibold">{d}</th>
                      <td><input type="checkbox" name={`active_${i}`} defaultChecked={r?.is_active} className="h-5 w-5 accent-maroon" aria-label={`${d} working`} /></td>
                      <td><input type="time" name={`start_${i}`} defaultValue={hhmm(r?.start_time ?? "19:00")} className="field !w-32" aria-label={`${d} start`} /></td>
                      <td><input type="time" name={`end_${i}`} defaultValue={hhmm(r?.end_time ?? "20:30")} className="field !w-32" aria-label={`${d} end`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminForm>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 text-xl text-maroon">Booking rules</h2>
        <AdminForm action={saveSlotConfig} submitLabel="Save booking rules">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Slot spacing (min)" name="slot_minutes" hint="How often slots start."><input id="slot_minutes" name="slot_minutes" type="number" min={5} max={240} defaultValue={settings?.slot_minutes ?? 30} className="field" /></Field>
            <Field label="Buffer after session (min)" name="buffer_minutes" hint="Kept free after each booking."><input id="buffer_minutes" name="buffer_minutes" type="number" min={0} max={120} defaultValue={settings?.buffer_minutes ?? 10} className="field" /></Field>
            <Field label="Minimum notice (hours)" name="min_notice_hours"><input id="min_notice_hours" name="min_notice_hours" type="number" min={0} max={720} defaultValue={settings?.min_notice_hours ?? 12} className="field" /></Field>
            <Field label="Book up to (days ahead)" name="max_advance_days"><input id="max_advance_days" name="max_advance_days" type="number" min={1} max={365} defaultValue={settings?.max_advance_days ?? 30} className="field" /></Field>
          </div>
        </AdminForm>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl text-maroon">Block a date or time range</h2>
          <AdminForm action={addBlockedDate} submitLabel="Block" resetOnSuccess>
            <Field label="Date (IST)" name="blocked_on"><input id="blocked_on" name="blocked_on" type="date" min={today} required className="field" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="From (optional)" name="start_time"><input id="start_time" name="start_time" type="time" className="field" /></Field>
              <Field label="To (optional)" name="end_time"><input id="end_time" name="end_time" type="time" className="field" /></Field>
            </div>
            <p className="text-xs text-ink-soft">Leave both times empty to block the whole day.</p>
            <Field label="Reason (private)" name="reason"><input id="reason" name="reason" className="field" maxLength={200} /></Field>
          </AdminForm>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Blocked dates</h2>
          {!blocked?.length ? <Empty>Nothing blocked.</Empty> : (
            <ul className="divide-y divide-sand">
              {blocked.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="block font-semibold">{formatDateIst(b.blocked_on)}</span>
                    <span className="block text-ink-soft">{b.start_time ? `${hhmm(b.start_time)}–${hhmm(b.end_time!)}` : "Whole day"}{b.reason ? ` · ${b.reason}` : ""}</span>
                  </span>
                  <AdminForm action={removeBlockedDate} submitLabel="Remove" danger className="shrink-0">
                    <input type="hidden" name="id" value={b.id} />
                  </AdminForm>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-xl text-maroon">Upcoming booked times</h2>
        {!booked?.length ? <Empty>No upcoming pending or confirmed bookings.</Empty> : (
          <ul className="divide-y divide-sand text-sm">
            {booked.map((b) => (
              <li key={b.id} className="flex justify-between gap-3 py-2.5">
                <span><span className="font-semibold">{formatDateTimeIst(b.starts_at)}</span> · {b.customer_name} · {b.service_title}</span>
                <span className="capitalize text-ink-soft">{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
