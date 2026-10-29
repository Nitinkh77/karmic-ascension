import { ChevronDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminForm, Check, Empty, Field, PageTitle } from "@/components/admin/ui";
import { deleteFaq, saveFaq } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "FAQs" };

export default async function FaqsAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: faqs }, { data: services }] = await Promise.all([
    supabase.from("faqs").select("*").order("sort_order").order("created_at"),
    supabase.from("services").select("id, title").order("title"),
  ]);

  const serviceSelect = (value: string | null, id: string) => (
    <select id={id} name="service_id" defaultValue={value ?? ""} className="field">
      <option value="">General (home page)</option>
      {(services ?? []).map((s) => <option key={s.id} value={s.id}>Only on: {s.title}</option>)}
    </select>
  );
  const serviceName = (id: string | null) => (id ? (services ?? []).find((s) => s.id === id)?.title ?? "A service" : "General");

  return (
    <>
      <PageTitle title="FAQs" description="General FAQs appear on the home page; service FAQs appear on that service's page. Unpublished FAQs stay hidden." />

      <details className="group mb-6 rounded-2xl border border-sand bg-white-warm shadow-card" open={!faqs?.length}>
        <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-maroon text-ivory"><Plus className="h-5 w-5" aria-hidden="true" /></span>
          <span className="text-xl text-maroon">Add a FAQ</span>
          <ChevronDown className="ml-auto h-5 w-5 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-sand p-5 sm:p-6">
          <AdminForm action={saveFaq} submitLabel="Add FAQ" resetOnSuccess>
            <Field label="Question" name="question"><input id="question" name="question" required maxLength={300} className="field" /></Field>
            <Field label="Answer" name="answer"><textarea id="answer" name="answer" rows={3} required maxLength={4000} className="field" /></Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Shown on" name="service_id">{serviceSelect(null, "service_id")}</Field>
              <Field label="Order" name="sort_order"><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={100} className="field" /></Field>
              <div className="pt-6"><Check name="is_published" label="Published" /></div>
            </div>
          </AdminForm>
        </div>
      </details>

      <h2 className="mb-3 text-2xl text-maroon">All FAQs ({faqs?.length ?? 0})</h2>
      {!faqs?.length ? <Empty>No FAQs yet.</Empty> : (
        <ul className="space-y-3">
          {faqs.map((f) => (
            <li key={f.id}>
              <details className="group rounded-2xl border border-sand bg-white-warm shadow-card open:border-gold">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-parchment/50 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-charcoal">{f.question}</span>
                      {f.is_published ? <Badge tone="green">published</Badge> : <Badge tone="grey">hidden</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-soft">{serviceName(f.service_id)} · {f.answer}</span>
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="space-y-5 border-t border-sand p-5 sm:p-6">
                  <AdminForm action={saveFaq} submitLabel="Save changes">
                    <input type="hidden" name="id" value={f.id} />
                    <Field label="Question" name={`q_${f.id}`}><input id={`q_${f.id}`} name="question" required defaultValue={f.question} className="field" maxLength={300} /></Field>
                    <Field label="Answer" name={`a_${f.id}`}><textarea id={`a_${f.id}`} name="answer" rows={4} required defaultValue={f.answer} className="field" maxLength={4000} /></Field>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field label="Shown on" name={`s_${f.id}`}>{serviceSelect(f.service_id, `s_${f.id}`)}</Field>
                      <Field label="Order" name={`o_${f.id}`}><input id={`o_${f.id}`} name="sort_order" type="number" min={0} defaultValue={f.sort_order} className="field" /></Field>
                      <div className="pt-6"><Check name="is_published" label="Published" defaultChecked={f.is_published} /></div>
                    </div>
                  </AdminForm>
                  <div className="border-t border-sand pt-4">
                    <AdminForm action={deleteFaq} submitLabel="Delete this FAQ" danger confirmMessage="Delete this FAQ? This cannot be undone.">
                      <input type="hidden" name="id" value={f.id} />
                    </AdminForm>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
