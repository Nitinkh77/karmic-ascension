import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { AdminForm, Card, Empty, Field, PageTitle } from "@/components/admin/ui";
import { deleteMedia, replaceMedia, updateMedia, uploadMedia } from "@/app/admin/(panel)/actions";
import { listMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  const { supabase } = await requireAdmin();
  const assets = await listMedia(supabase);

  return (
    <>
      <PageTitle title="Media library" description="Upload PNG, JPG, WebP or AVIF images up to 5 MB. Alt text is required — it describes the image for screen readers and search engines." />

      <Card>
        <h2 className="mb-4 text-xl text-maroon">Upload an image</h2>
        <AdminForm action={uploadMedia} submitLabel="Upload" resetOnSuccess>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Image file" name="file"><input id="file" name="file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required className="field !py-2" /></Field>
            <Field label="Alt text (required)" name="alt_text"><input id="alt_text" name="alt_text" required maxLength={300} className="field" /></Field>
            <Field label="Folder" name="folder">
              <select id="folder" name="folder" className="field" defaultValue="general">
                {["general", "hero", "about", "services", "gallery", "social"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>
        </AdminForm>
      </Card>

      <h2 className="mb-4 mt-10 text-2xl text-maroon">Images ({assets.length})</h2>
      {assets.length === 0 ? (
        <Empty>No images yet. See <code>docs/ASSETS.md</code> for the list of images the design has slots for, with ready-to-use generation prompts.</Empty>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-2xl border border-sand bg-white-warm">
              <div className="relative aspect-[16/10] bg-parchment">
                <Image src={a.url} alt={a.alt_text} fill sizes="(min-width:1280px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover" unoptimized />
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-semibold text-charcoal">{a.alt_text}</p>
                <p className="break-all font-mono text-xs text-ink-soft">{a.storage_path}</p>
                <details className="group mt-3 rounded-xl border border-sand">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-maroon [&::-webkit-details-marker]:hidden">
                    Edit, replace or delete
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="space-y-5 border-t border-sand p-3">
                    <AdminForm action={updateMedia} submitLabel="Save details" className="space-y-3">
                      <input type="hidden" name="id" value={a.id} />
                      <Field label="Alt text" name={`alt_${a.id}`}><input id={`alt_${a.id}`} name="alt_text" defaultValue={a.alt_text} className="field" maxLength={300} /></Field>
                      <Field label="Folder" name={`folder_${a.id}`}><input id={`folder_${a.id}`} name="folder" defaultValue={a.folder} className="field" /></Field>
                    </AdminForm>
                    <AdminForm action={replaceMedia} submitLabel="Replace file" className="space-y-3">
                      <input type="hidden" name="id" value={a.id} />
                      <Field label="Replace with new file" name={`file_${a.id}`}><input id={`file_${a.id}`} name="file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="field !py-2" /></Field>
                    </AdminForm>
                    <AdminForm action={deleteMedia} submitLabel="Delete image" danger confirmMessage="Delete this image? Places using it will show the default ornament.">
                      <input type="hidden" name="id" value={a.id} />
                    </AdminForm>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
