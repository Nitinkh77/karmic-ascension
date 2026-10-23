import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Card, Field, PageTitle } from "@/components/admin/ui";
import { deleteLead, saveLeadNotes, setLeadStatus } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDateTimeIst } from "@/lib/booking/slots";
import { LEAD_COLUMNS, leadTone, sourceLabel } from "@/lib/leads";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/validation";
import { whatsappLink } from "@/lib/utils";

export const metadata = { title: "Lead" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from("leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as unknown as Lead;
  let serviceTitle: string | null = null;
  if (l.service_id) {
    const { data: svc } = await supabase.from("services").select("title").eq("id", l.service_id).maybeSingle();
    serviceTitle = svc ? String((svc as { title: unknown }).title) : null;
  }
  const wa = l.phone ? whatsappLink(l.phone.replace(/\D/g, ""), `Namaste ${l.name}, thank you for your enquiry with Karmic Ascension.`) : null;

  return (
    <>
      <Link href="/admin/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All leads
      </Link>
      <PageTitle title={l.name} description={`Received ${formatDateTimeIst(l.created_at)} IST · ${sourceLabel(l.source)}`}>
        <Badge tone={leadTone[l.status]}>{l.status}</Badge>
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-xl text-maroon">Enquiry</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Phone", l.phone ?? "—"],
              ["Email", l.email ?? "—"],
              ["Interested in", serviceTitle ?? "—"],
              ["Agreed to be contacted", l.consent ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-0.5 break-words text-charcoal">{v}</dd></div>
            ))}
          </dl>
          {l.message && (
            <div className="mt-4 rounded-lg bg-parchment p-3 text-sm"><p className="eyebrow mb-1">Message</p><p className="whitespace-pre-line">{l.message}</p></div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {l.phone && <a className="font-semibold text-maroon underline" href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}>Call</a>}
            {wa && <a className="font-semibold text-maroon underline" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp<span className="sr-only"> (opens in a new tab)</span></a>}
            {l.email && <a className="font-semibold text-maroon underline" href={`mailto:${l.email}`}>Email</a>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-xl text-maroon">Status</h2>
            <AdminForm action={setLeadStatus} submitLabel="Update status">
              <input type="hidden" name="id" value={l.id} />
              <Field label="Status" name="status">
                <select id="status" name="status" defaultValue={l.status} className="field">
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </AdminForm>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Private notes</h2>
            <AdminForm action={saveLeadNotes} submitLabel="Save note">
              <input type="hidden" name="id" value={l.id} />
              <Field label="Notes (never shown to the visitor)" name="admin_notes">
                <textarea id="admin_notes" name="admin_notes" rows={4} defaultValue={l.admin_notes ?? ""} className="field" maxLength={4000} />
              </Field>
            </AdminForm>
          </Card>

          <Card>
            <h2 className="mb-3 text-xl text-maroon">Delete</h2>
            <AdminForm action={deleteLead} submitLabel="Delete lead" danger confirmMessage="Delete this lead permanently?">
              <input type="hidden" name="id" value={l.id} />
              <p className="text-sm text-ink-soft">Removes the enquiry for good. Use this for spam or when a person asks you to erase their data.</p>
            </AdminForm>
          </Card>
        </div>
      </div>
    </>
  );
}
