import { Badge } from "@/components/ui";
import { AdminForm, Card, Check, Empty, Field, PageTitle } from "@/components/admin/ui";
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

  return (
    <>
      <PageTitle title="FAQs" description="General FAQs appear on the home page; service FAQs appear on that service's page. Unpublished FAQs stay hidden." />

      <Card>
        <h2 className="mb-4 text-xl text-maroon">Add a FAQ</h2>
        <AdminForm action={saveFaq} submitLabel="Add FAQ" resetOnSuccess>
          <Field label="Question" name="question"><input id="question" name="question" required maxLength={300} className="field" /></Field>
          <Field label="Answer" name="answer"><textarea id="answer" name="answer" rows={3} required maxLength={4000} className="field" /></Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Shown on" name="service_id">{serviceSelect(null, "service_id")}</Field>
            <Field label="Order" name="sort_order"><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={100} className="field" /></Field>
            <div className="pt-6"><Check name="is_published" label="Published" /></div>
          </div>
        </AdminForm>
      </Card>

      <h2 className="mb-4 mt-10 text-2xl text-maroon">All FAQs ({faqs?.length ?? 0})</h2>
      {!faqs?.length ? <Empty>No FAQs yet.</Empty> : (
        <ul className="space-y-5">
          {faqs.map((f) => (
            <li key={f.id}>
              <Card>
                <div className="mb-3 flex gap-2">{f.is_published ? <Badge tone="green">published</Badge> : <Badge tone="grey">hidden</Badge>}</div>
                <AdminForm action={saveFaq} submitLabel="Save">
                  <input type="hidden" name="id" value={f.id} />
                  <Field label="Question" name={`q_${f.id}`}><input id={`q_${f.id}`} name="question" required defaultValue={f.question} className="field" maxLength={300} /></Field>
                  <Field label="Answer" name={`a_${f.id}`}><textarea id={`a_${f.id}`} name="answer" rows={3} required defaultValue={f.answer} className="field" maxLength={4000} /></Field>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Shown on" name={`s_${f.id}`}>{serviceSelect(f.service_id, `s_${f.id}`)}</Field>
                    <Field label="Order" name={`o_${f.id}`}><input id={`o_${f.id}`} name="sort_order" type="number" min={0} defaultValue={f.sort_order} className="field" /></Field>
                    <div className="pt-6"><Check name="is_published" label="Published" defaultChecked={f.is_published} /></div>
                  </div>
                </AdminForm>
                <div className="mt-3 border-t border-sand pt-3">
                  <AdminForm action={deleteFaq} submitLabel="Delete" danger confirmMessage="Delete this FAQ?">
                    <input type="hidden" name="id" value={f.id} />
                  </AdminForm>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
