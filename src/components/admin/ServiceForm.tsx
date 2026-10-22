import { AdminForm, Check, Field } from "@/components/admin/ui";
import { MediaSelect } from "@/components/admin/MediaSelect";
import { saveService } from "@/app/admin/(panel)/actions";
import type { MediaAsset, Service } from "@/lib/types";
import { paiseToRupeesInput } from "@/lib/utils";

export function ServiceForm({ service, assets }: { service?: Service | null; assets: MediaAsset[] }) {
  const s = service;
  return (
    <AdminForm action={saveService} submitLabel={s ? "Save service" : "Create service"} className="space-y-6">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" name="title">
          <input id="title" name="title" required defaultValue={s?.title} className="field" maxLength={160} />
        </Field>
        <Field label="URL slug" name="slug" hint="Leave empty to generate from the title. Changing it changes the public link.">
          <input id="slug" name="slug" defaultValue={s?.slug} className="field" maxLength={80} />
        </Field>
        <Field label="Price (₹)" name="price_rupees" hint="Whole rupees or with paise, e.g. 1500 or 1500.50. Leave empty to show “Price on request”.">
          <input id="price_rupees" name="price_rupees" inputMode="decimal" defaultValue={paiseToRupeesInput(s?.price_paise)} className="field" />
        </Field>
        <Field label="Duration (minutes)" name="duration_minutes">
          <input id="duration_minutes" name="duration_minutes" type="number" min={10} max={480} step={5} required defaultValue={s?.duration_minutes ?? 30} className="field" />
        </Field>
      </div>

      <Field label="Short description (cards and search results)" name="short_description">
        <textarea id="short_description" name="short_description" rows={2} defaultValue={s?.short_description} className="field" maxLength={300} />
      </Field>
      <Field label="Full description" name="description" hint="Blank line = new paragraph.">
        <textarea id="description" name="description" rows={6} defaultValue={s?.description} className="field" maxLength={8000} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="What this includes (one per line)" name="features_text">
          <textarea id="features_text" name="features_text" rows={5} defaultValue={s?.features.join("\n")} className="field" />
        </Field>
        <Field label="What the customer receives (one per line)" name="deliverables_text">
          <textarea id="deliverables_text" name="deliverables_text" rows={5} defaultValue={s?.deliverables.join("\n")} className="field" />
        </Field>
      </div>

      <MediaSelect name="image_asset_id" assets={assets} defaultValue={s?.image_asset_id} label="Service image" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status" name="status">
          <select id="status" name="status" defaultValue={s?.status ?? "draft"} className="field">
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (visible and bookable)</option>
            <option value="archived">Archived (hidden)</option>
          </select>
        </Field>
        <Field label="Display order" name="sort_order" hint="Lower numbers appear first.">
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={s?.sort_order ?? 100} className="field" />
        </Field>
      </div>
      <div className="space-y-3">
        <Check name="is_featured" label="Featured on the home page" defaultChecked={s?.is_featured} />
        <Check name="requires_birth_details" label="Ask for date, time and place of birth" hint="Shown to the customer with an explanation of why." defaultChecked={s?.requires_birth_details ?? true} />
        <Check name="is_draft" label="Needs owner review" hint="Marks copy, price or duration that is still a placeholder. Does not hide the service." defaultChecked={s?.is_draft ?? false} />
      </div>
    </AdminForm>
  );
}
