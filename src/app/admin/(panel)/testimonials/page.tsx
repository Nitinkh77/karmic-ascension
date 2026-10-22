import { Badge } from "@/components/ui";
import { AdminForm, Card, Check, Empty, Field, PageTitle } from "@/components/admin/ui";
import { deleteTestimonial, saveTestimonial } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsAdminPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("testimonials").select("*").order("sort_order").order("created_at");

  return (
    <>
      <PageTitle title="Testimonials" description="Only real client words you have permission to publish. A testimonial goes live only when it is ticked both Verified and Published — the database enforces this." />

      <Card>
        <h2 className="mb-4 text-xl text-maroon">Add a testimonial</h2>
        <AdminForm action={saveTestimonial} submitLabel="Add testimonial" resetOnSuccess>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Client name (or initials)" name="author_name"><input id="author_name" name="author_name" required maxLength={120} className="field" /></Field>
            <Field label="Detail (optional, e.g. city)" name="author_detail"><input id="author_detail" name="author_detail" maxLength={160} className="field" /></Field>
          </div>
          <Field label="Their words" name="quote"><textarea id="quote" name="quote" rows={4} required maxLength={2000} className="field" /></Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Rating 1–5 (optional)" name="rating"><input id="rating" name="rating" type="number" min={1} max={5} className="field" /></Field>
            <Field label="Where you verified it" name="source" hint="e.g. Instagram DM, written note"><input id="source" name="source" maxLength={200} className="field" /></Field>
            <Field label="Order" name="sort_order"><input id="sort_order" name="sort_order" type="number" min={0} defaultValue={100} className="field" /></Field>
          </div>
          <div className="space-y-3">
            <Check name="is_verified" label="Verified — this is a genuine client testimonial I may publish" />
            <Check name="is_published" label="Published on the website" hint="Requires Verified." />
          </div>
        </AdminForm>
      </Card>

      <h2 className="mb-4 mt-10 text-2xl text-maroon">All testimonials ({data?.length ?? 0})</h2>
      {!data?.length ? <Empty>No testimonials. Nothing is shown on the site until you add and verify real ones.</Empty> : (
        <ul className="space-y-5">
          {data.map((t) => (
            <li key={t.id}>
              <Card>
                <div className="mb-3 flex gap-2">
                  {t.is_verified ? <Badge tone="green">verified</Badge> : <Badge tone="saffron">unverified</Badge>}
                  {t.is_published ? <Badge tone="green">published</Badge> : <Badge tone="grey">hidden</Badge>}
                </div>
                <AdminForm action={saveTestimonial} submitLabel="Save">
                  <input type="hidden" name="id" value={t.id} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Client name" name={`n_${t.id}`}><input id={`n_${t.id}`} name="author_name" required defaultValue={t.author_name} className="field" /></Field>
                    <Field label="Detail" name={`d_${t.id}`}><input id={`d_${t.id}`} name="author_detail" defaultValue={t.author_detail ?? ""} className="field" /></Field>
                  </div>
                  <Field label="Their words" name={`q_${t.id}`}><textarea id={`q_${t.id}`} name="quote" rows={3} required defaultValue={t.quote} className="field" /></Field>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Rating" name={`r_${t.id}`}><input id={`r_${t.id}`} name="rating" type="number" min={1} max={5} defaultValue={t.rating ?? ""} className="field" /></Field>
                    <Field label="Verified via" name={`s_${t.id}`}><input id={`s_${t.id}`} name="source" defaultValue={t.source ?? ""} className="field" /></Field>
                    <Field label="Order" name={`o_${t.id}`}><input id={`o_${t.id}`} name="sort_order" type="number" min={0} defaultValue={t.sort_order} className="field" /></Field>
                  </div>
                  <div className="space-y-3">
                    <Check name="is_verified" label="Verified" defaultChecked={t.is_verified} />
                    <Check name="is_published" label="Published" defaultChecked={t.is_published} />
                  </div>
                </AdminForm>
                <div className="mt-3 border-t border-sand pt-3">
                  <AdminForm action={deleteTestimonial} submitLabel="Delete" danger confirmMessage="Delete this testimonial?">
                    <input type="hidden" name="id" value={t.id} />
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
