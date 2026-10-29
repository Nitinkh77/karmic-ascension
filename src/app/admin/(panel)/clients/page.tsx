
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui";
import { Empty, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst, istDateString } from "@/lib/booking/slots";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Clients" };

interface Row {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_title: string;
  starts_at: string;
  status: string;
  payment_status: string;
  service_price_paise: number | null;
  follow_up_on?: string | null;
  follow_up_done?: boolean;
}

interface Client {
  key: string;
  name: string;
  email: string;
  phone: string;
  bookings: number;
  completed: number;
  paidPaise: number;
  lastId: string;
  lastAt: string;
  lastService: string;
  followDue: boolean;
}

const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

/** Everyone who has booked, grouped by email. */
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireAdmin();

  const q = one((await searchParams).q)
    .trim()
    .slice(0, 80)
    .toLowerCase();

  // Keep the two query results separate so TypeScript does not
  // try to assign incompatible Supabase response types.
  const primaryResult = await supabase
    .from("bookings")
    .select(
      "id, customer_name, customer_email, customer_phone, service_title, starts_at, status, payment_status, service_price_paise, follow_up_on, follow_up_done"
    )
    .order("starts_at", { ascending: false })
    .limit(3000);

  let rows: Row[] = [];
  let loadError: string | null = null;

  if (primaryResult.error) {
    // Fallback for databases where the follow-up migration
    // has not been applied yet.
    const fallbackResult = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_email, customer_phone, service_title, starts_at, status, payment_status, service_price_paise"
      )
      .order("starts_at", { ascending: false })
      .limit(3000);

    if (fallbackResult.error) {
      loadError = fallbackResult.error.message;
    } else {
      rows = (fallbackResult.data ?? []) as unknown as Row[];
    }
  } else {
    rows = (primaryResult.data ?? []) as unknown as Row[];
  }

  const today = istDateString(new Date());
  const map = new Map<string, Client>();

  for (const r of rows) {
    const key = r.customer_email.trim().toLowerCase();

    let c = map.get(key);

    if (!c) {
      // Rows arrive newest first, so the first booking is the latest.
      c = {
        key,
        name: r.customer_name,
        email: r.customer_email,
        phone: r.customer_phone,
        bookings: 0,
        completed: 0,
        paidPaise: 0,
        lastId: r.id,
        lastAt: r.starts_at,
        lastService: r.service_title,
        followDue: false,
      };

      map.set(key, c);
    }

    if (r.status !== "cancelled") {
      c.bookings += 1;
    }

    if (r.status === "completed") {
      c.completed += 1;
    }

    if (r.payment_status === "paid") {
      c.paidPaise += r.service_price_paise ?? 0;
    }

    if (r.follow_up_on && !r.follow_up_done && r.follow_up_on <= today) {
      c.followDue = true;
    }
  }

  let clients = [...map.values()];

  if (q) {
    clients = clients.filter((c) =>
      `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q)
    );
  }

  clients.sort(
    (a, b) =>
      Number(b.followDue) - Number(a.followDue) ||
      b.lastAt.localeCompare(a.lastAt)
  );

  const allClients = [...map.values()];
  const repeat = allClients.filter((c) => c.bookings > 1).length;
  const lifetime = allClients.reduce((sum, c) => sum + c.paidPaise, 0);
  const followUpsDue = allClients.filter((c) => c.followDue).length;

  return (
    <>
      <PageTitle
        title="Clients"
        description="Everyone who has booked a consultation, with visits, lifetime value and follow-ups. Open a client to see their notes and history."
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Clients", String(map.size)],
          ["Returning clients", String(repeat)],
          ["Lifetime value", formatPrice(lifetime, "INR") ?? "₹0"],
          ["Follow-ups due", String(followUpsDue)],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-2xl border border-sand bg-white-warm p-4"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {k}
            </dt>
            <dd className="mt-1 font-serif text-3xl text-maroon">{v}</dd>
          </div>
        ))}
      </dl>

      <form method="get" role="search" className="relative mb-4 max-w-md">
        <label htmlFor="cq" className="sr-only">
          Search clients
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden="true"
        />
        <input
          id="cq"
          name="q"
          defaultValue={q}
          placeholder="Search name, email or phone"
          className="field !pl-9"
        />
      </form>

      {loadError && rows.length === 0 ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger"
        >
          Could not load clients. Please try again later.
        </p>
      ) : clients.length === 0 ? (
        <Empty>
          {q
            ? "No clients match your search."
            : "No bookings yet. Clients appear here after their first booking."}
        </Empty>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {clients.map((c) => (
              <li key={c.key}>
                <Link
                  href={`/admin/bookings/${c.lastId}`}
                  className="block rounded-2xl border border-sand bg-white-warm p-4 hover:bg-parchment"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-semibold text-charcoal">
                      {c.name}
                    </span>
                    {c.followDue && (
                      <Badge tone="red">follow-up due</Badge>
                    )}
                  </span>

                  <span className="block break-all text-sm text-ink-soft">
                    {c.email} · {c.phone}
                  </span>

                  <span className="mt-2 block text-sm">
                    {c.bookings} booking{c.bookings === 1 ? "" : "s"} ·{" "}
                    {c.completed} completed ·{" "}
                    {formatPrice(c.paidPaise, "INR")}
                  </span>

                  <span className="block text-xs text-ink-soft">
                    Last: {c.lastService}, {formatDateTimeIst(c.lastAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-sand bg-white-warm md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Clients</caption>

              <thead className="border-b border-sand bg-parchment text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="p-3">
                    Client
                  </th>
                  <th scope="col" className="p-3">
                    Bookings
                  </th>
                  <th scope="col" className="p-3">
                    Completed
                  </th>
                  <th scope="col" className="p-3">
                    Lifetime value
                  </th>
                  <th scope="col" className="p-3">
                    Last booking
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-sand">
                {clients.map((c) => (
                  <tr key={c.key} className="hover:bg-ivory">
                    <td className="p-3">
                      <Link
                        href={`/admin/bookings/${c.lastId}`}
                        className="font-semibold text-maroon underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </Link>

                      {c.followDue && (
                        <span className="ml-2">
                          <Badge tone="red">follow-up due</Badge>
                        </span>
                      )}

                      <span className="block break-all text-xs text-ink-soft">
                        {c.email} · {c.phone}
                      </span>
                    </td>

                    <td className="p-3">{c.bookings}</td>
                    <td className="p-3">{c.completed}</td>
                    <td className="p-3">
                      {formatPrice(c.paidPaise, "INR")}
                    </td>

                    <td className="p-3">
                      {c.lastService}
                      <span className="block text-xs text-ink-soft">
                        {formatDateTimeIst(c.lastAt)}
                      </span>
                    </td>
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
