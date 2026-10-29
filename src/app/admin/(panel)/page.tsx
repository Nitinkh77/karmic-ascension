import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Inbox,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge, buttonStyles } from "@/components/ui";
import { Card, Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst, istDateString } from "@/lib/booking/slots";
import { getBookingMode } from "@/lib/booking/config";
import { leadTone, sourceLabel } from "@/lib/leads";
import { cn, formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const statusTone = { pending: "saffron", confirmed: "green", cancelled: "grey", completed: "maroon" } as const;
const DAY = 86400_000;
const istStart = () => {
  // Midnight today in IST, as a UTC instant.
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3600_000);
};

export default async function DashboardPage() {
  const { supabase, profile } = await requireAdmin();
  const now = new Date();
  const nowIso = now.toISOString();
  const today = istStart().toISOString();
  const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString();
  const weekAhead = new Date(now.getTime() + 7 * DAY).toISOString();
  const weekAgo30 = new Date(now.getTime() - 30 * DAY).toISOString();

  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const bookingsBy = (status: string) => count(head("bookings").eq("status", status));

  const [
    total, pending, confirmed, completed, cancelled, awaitingPayment, next7,
    paidRows, leadsTotal, leadsNew, leadsToday, sourceRows, customers, customersWeek, services,
    upcoming, recent, newestLeads, followUps, reviewsPending,
  ] = await Promise.all([
    count(head("bookings")),
    bookingsBy("pending"),
    bookingsBy("confirmed"),
    bookingsBy("completed"),
    bookingsBy("cancelled"),
    count(head("bookings").in("status", ["pending", "confirmed"]).in("payment_status", ["unpaid", "pending_verification"])),
    count(head("bookings").in("status", ["pending", "confirmed"]).gte("starts_at", nowIso).lte("starts_at", weekAhead)),
    supabase.from("bookings").select("service_price_paise").eq("payment_status", "paid").limit(5000),
    count(head("leads")),
    count(head("leads").eq("status", "new")),
    count(head("leads").gte("created_at", today)),
    supabase.from("leads").select("source").limit(2000),
    count(head("profiles").eq("role", "user")),
    count(head("profiles").eq("role", "user").gte("created_at", weekAgo)),
    count(head("services").eq("status", "published")),
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
      .limit(6),
    supabase.from("leads").select("id, name, status, source, created_at").order("created_at", { ascending: false }).limit(5),
    // Follow-ups that are due (needs the CRM migration; resolves with an error object, not a throw, if it is missing).
    supabase
      .from("bookings")
      .select("id, customer_name, service_title, follow_up_on")
      .eq("follow_up_done", false)
      .not("follow_up_on", "is", null)
      .lte("follow_up_on", istDateString(new Date()))
      .order("follow_up_on")
      .limit(6),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .is("review_requested_at", null)
      .gte("starts_at", weekAgo30),
  ]);
  const followRows = followUps.error ? [] : (followUps.data ?? []);
  const reviewsToAsk = reviewsPending.error ? 0 : (reviewsPending.count ?? 0);

  const bookable = getBookingMode().enabled;
  const received = (paidRows.data ?? []).reduce((s, r) => s + (Number(r.service_price_paise) || 0), 0);
  const dbOk = !paidRows.error && !upcoming.error;

  // Where enquiries come from.
  const bySource = new Map<string, number>();
  for (const r of sourceRows.data ?? []) {
    const k = String((r as { source: string | null }).source || "unknown");
    bySource.set(k, (bySource.get(k) ?? 0) + 1);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const srcTotal = sources.reduce((s, [, n]) => s + n, 0) || 1;

  // What needs doing now.
  const todo: Array<{ text: string; href: string }> = [];
  if (followRows.length > 0) todo.push({ text: `${followRows.length} client follow-up${followRows.length === 1 ? " is" : "s are"} due`, href: "/admin/bookings?followup=due" });
  if (leadsNew > 0) todo.push({ text: `${leadsNew} new ${leadsNew === 1 ? "enquiry needs" : "enquiries need"} a reply`, href: "/admin/leads?status=new" });
  if (pending > 0) todo.push({ text: `${pending} ${pending === 1 ? "booking is" : "bookings are"} waiting for confirmation`, href: "/admin/bookings?status=pending" });
  if (reviewsToAsk > 0) todo.push({ text: `${reviewsToAsk} completed ${reviewsToAsk === 1 ? "session has" : "sessions have"} not been asked for a Google review`, href: "/admin/bookings?status=completed" });
  if (awaitingPayment > 0) todo.push({ text: `${awaitingPayment} open ${awaitingPayment === 1 ? "booking has" : "bookings have"} no verified payment yet`, href: "/admin/bookings?payment=unpaid" });

  const kpis: Array<{ label: string; value: string; note: string; Icon: LucideIcon; href: string }> = [
    { label: "Customers", value: String(customers), note: `+${customersWeek} this week`, Icon: UserRound, href: "/admin/customers" },
    { label: "Bookings", value: String(total), note: `${confirmed} confirmed · ${pending} pending`, Icon: CalendarCheck, href: "/admin/bookings" },
    { label: "Enquiries", value: String(leadsTotal), note: `+${leadsToday} today`, Icon: Inbox, href: "/admin/leads" },
    { label: "Payments received", value: formatPrice(received) ?? "₹0", note: "Bookings marked paid", Icon: Wallet, href: "/admin/analytics" },
    { label: "Next 7 days", value: String(next7), note: "Upcoming sessions", Icon: CalendarClock, href: "/admin/bookings?status=confirmed" },
    { label: "Awaiting payment", value: String(awaitingPayment), note: "Open, not yet paid", Icon: Clock, href: "/admin/bookings?payment=unpaid" },
    { label: "New enquiries", value: String(leadsNew), note: "Not yet followed up", Icon: Users, href: "/admin/leads?status=new" },
    { label: "Sessions completed", value: String(completed), note: `${cancelled} cancelled`, Icon: CheckCircle2, href: "/admin/bookings?status=completed" },
  ];

  const modules: Array<{ href: string; label: string; Icon: LucideIcon }> = [
    { href: "/admin/clients", label: "Clients (CRM)", Icon: UserRound },
    { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
    { href: "/admin/leads", label: "Leads", Icon: Inbox },
    { href: "/admin/services", label: "Services & pricing", Icon: Sparkles },
    { href: "/admin/content", label: "Website content", Icon: FileText },
    { href: "/admin/analytics", label: "Analytics", Icon: TrendingUp },
  ];

  const name = profile.full_name?.split(" ")[0];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-maroon sm:text-4xl">Command center{name ? `, ${name}` : ""}</h1>
          <p className="mt-1.5 max-w-2xl text-ink-soft">Live figures from your bookings, enquiries and customers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/bookings" className={buttonStyles("primary", "md")}>Bookings</Link>
          <Link href="/admin/leads" className={buttonStyles("secondary", "md")}>Leads</Link>
          <Link href="/admin/clients" className={buttonStyles("secondary", "md")}>Clients</Link>
        </div>
      </div>

      {todo.length > 0 ? (
        <section aria-labelledby="todo-h" className="mb-6 rounded-2xl border border-saffron/50 bg-saffron-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-saffron-deep" aria-hidden="true" />
              <div>
                <h2 id="todo-h" className="font-sans text-base font-semibold text-charcoal">Needs your attention</h2>
                <ul className="mt-1 space-y-0.5 text-sm text-charcoal">
                  {todo.map((t) => (
                    <li key={t.href}><Link href={t.href} className="font-semibold text-saffron-deep underline underline-offset-2">{t.text}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href={todo[0].href} className={buttonStyles("primary", "md")}>Take action</Link>
          </div>
        </section>
      ) : (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-2xl border border-success/30 bg-green-50 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> All clear. Nothing is waiting for you right now.
        </p>
      )}

      {services === 0 && (
        <p className="mb-6 rounded-xl border border-saffron/40 bg-saffron-soft p-4 text-sm">
          No services are published yet, so visitors cannot book. <Link href="/admin/services" className="font-semibold underline">Publish a service</Link>.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, note, Icon, href }) => (
          <Card key={label} className="relative p-5 transition-shadow hover:shadow-lift">
            <div className="flex items-start justify-between gap-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <Link href={href} className="after:absolute after:inset-0 hover:underline">{label}</Link>
              </dt>
              <Icon className="h-5 w-5 shrink-0 text-gold-deep" aria-hidden="true" />
            </div>
            <dd className="mt-2 font-serif text-3xl text-maroon sm:text-4xl">{value}</dd>
            <p className="mt-1 text-xs text-ink-soft">{note}</p>
          </Card>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-charcoal">Where enquiries come from</h2>
          {sources.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">No enquiries yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {sources.map(([s, n]) => (
                <li key={s}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words">{sourceLabel(s)}</span>
                    <span className="font-semibold text-maroon">{n} ({Math.round((n / srcTotal) * 100)}%)</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-parchment"><div className="h-full rounded-full bg-gold" style={{ width: `${(n / srcTotal) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-charcoal">Bookings by status</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {([
              ["Confirmed", confirmed, "border-success/40 bg-green-50 text-success"],
              ["Pending", pending, "border-saffron/50 bg-saffron-soft text-saffron-deep"],
              ["Completed", completed, "border-maroon/30 bg-maroon-soft text-maroon"],
              ["Cancelled", cancelled, "border-sand bg-parchment text-ink-soft"],
            ] as const).map(([k, v, c]) => (
              <div key={k} className={cn("rounded-xl border p-3", c)}>
                <dt className="text-xs font-semibold uppercase tracking-wide">{k}</dt>
                <dd className="mt-1 font-serif text-3xl">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-charcoal">System status</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {([
              ["Database", dbOk ? "Connected" : "Problem", dbOk],
              ["Public booking", bookable && services > 0 ? "Open" : bookable ? "No services published" : "Closed", bookable && services > 0],
              ["Booking alerts", process.env.RESEND_API_KEY ? "E-mail on" : "E-mail off", Boolean(process.env.RESEND_API_KEY)],
              ["Payments", "Verified by you", true],
            ] as const).map(([k, v, ok]) => (
              <li key={k} className="flex items-center justify-between gap-3 rounded-lg bg-parchment/60 px-3 py-2">
                <span className="flex items-center gap-2"><Database className="h-4 w-4 text-gold-deep" aria-hidden="true" />{k}</span>
                <span className={cn("font-semibold", ok ? "text-success" : "text-danger")}>{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-soft">Payments are confirmed by you on each booking. Online payment is not switched on.</p>
        </Card>
      </div>

      {followRows.length > 0 && (
        <section aria-labelledby="fu-h" className="mt-6">
          <h2 id="fu-h" className="mb-3 flex items-baseline justify-between gap-2 text-2xl text-maroon">
            Follow-ups due <Link href="/admin/bookings?followup=due" className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-saffron-deep hover:underline">All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followRows.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/bookings/${f.id}`} className="block rounded-2xl border border-saffron/40 bg-white-warm p-4 hover:bg-parchment">
                  <span className="block font-semibold text-charcoal">{f.customer_name}</span>
                  <span className="block text-sm text-ink-soft">{f.service_title}</span>
                  <span className="mt-1 block text-xs font-semibold text-saffron-deep">Due {new Date(`${f.follow_up_on}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card className="mt-6 min-w-0">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-charcoal">Quick access</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {modules.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="spring flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-sand bg-ivory p-3 text-center text-sm font-semibold text-charcoal hover:border-gold hover:bg-parchment">
                <Icon className="h-6 w-6 text-gold-deep" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="up-h" className="min-w-0">
          <h2 id="up-h" className="mb-3 text-2xl text-maroon">Upcoming appointments</h2>
          {!upcoming.data?.length ? (
            <Empty>No upcoming pending or confirmed appointments.</Empty>
          ) : (
            <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white-warm">
              {upcoming.data.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-parchment">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-charcoal">{b.customer_name}</span>
                      <span className="block text-sm text-ink-soft">{b.service_title} · {formatDateTimeIst(b.starts_at)}</span>
                    </span>
                    <Badge tone={statusTone[b.status as keyof typeof statusTone]}>{b.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="lead-h" className="min-w-0">
          <h2 id="lead-h" className="mb-3 flex items-baseline justify-between gap-2 text-2xl text-maroon">
            Latest enquiries <Link href="/admin/leads" className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-saffron-deep hover:underline">All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </h2>
          {!newestLeads.data?.length ? (
            <Empty>No enquiries yet. Messages from the Contact and service pages appear here.</Empty>
          ) : (
            <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white-warm">
              {newestLeads.data.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-parchment">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-charcoal">{l.name}</span>
                      <span className="block text-sm text-ink-soft">{sourceLabel(String(l.source ?? "unknown"))} · {formatDateTimeIst(l.created_at)}</span>
                    </span>
                    <Badge tone={leadTone[l.status as keyof typeof leadTone] ?? "grey"}>{l.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="act-h" className="min-w-0">
          <h2 id="act-h" className="mb-3 flex items-baseline justify-between gap-2 text-2xl text-maroon">
            Recent activity <Link href="/admin/activity" className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-saffron-deep hover:underline">All logs <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </h2>
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
                      <span className="block text-xs text-ink-soft">{bk?.public_code} · {formatDateTimeIst(e.created_at)}</span>
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
