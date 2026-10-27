import { Download } from "lucide-react";
import { Empty, PageTitle } from "@/components/admin/ui";
import { Badge, buttonStyles } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst } from "@/lib/booking/slots";

export const metadata = { title: "Customers" };

/** People who created an account on the website (Google or email). Admins are not listed. */
export default async function CustomersPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = data ?? [];

  return (
    <>
      <PageTitle title="Customers" description="People who signed up on the website. Use the email to follow up.">
        <a href="/admin/customers/export" className={buttonStyles("secondary", "md")}><Download className="h-4 w-4" aria-hidden="true" /> Export CSV</a>
      </PageTitle>
      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">Could not load customers.</p>
      ) : rows.length === 0 ? (
        <Empty>No sign-ups yet. Accounts created on the website appear here.</Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-soft">{rows.length} customer{rows.length === 1 ? "" : "s"}</p>
          <div className="overflow-x-auto rounded-2xl border border-sand bg-white-warm">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Customers</caption>
              <thead className="border-b border-sand bg-parchment text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="p-3">Joined (IST)</th>
                  <th scope="col" className="p-3">Name</th>
                  <th scope="col" className="p-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory">
                    <td className="whitespace-nowrap p-3">{formatDateTimeIst(c.created_at)}</td>
                    <td className="p-3">{c.full_name || <Badge tone="grey">no name</Badge>}</td>
                    <td className="break-all p-3">{c.email ? <a href={`mailto:${c.email}`} className="text-maroon underline-offset-2 hover:underline">{c.email}</a> : "—"}</td>
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
