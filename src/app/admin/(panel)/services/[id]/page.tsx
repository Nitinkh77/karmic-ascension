import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminForm, Card, PageTitle } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { deleteService } from "@/app/admin/(panel)/actions";
import { listMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import type { Service } from "@/lib/types";

export const metadata = { title: "Edit service" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data }, assets] = await Promise.all([
    supabase.from("services").select("*").eq("id", id).maybeSingle(),
    listMedia(supabase),
  ]);
  if (!data) notFound();
  const service = {
    ...data,
    features: Array.isArray(data.features) ? data.features : [],
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
  } as Service;

  return (
    <>
      <Link href="/admin/services" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All services
      </Link>
      <PageTitle title={service.title} description={`Public page: /services/${service.slug}`} />
      <Card><ServiceForm service={service} assets={assets} /></Card>

      <Card className="mt-6 border-danger/30">
        <h2 className="text-xl text-danger">Delete service</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Past bookings keep their saved service name and price. To hide a service without deleting it, set its status to Archived instead.
        </p>
        <div className="mt-4">
          <AdminForm action={deleteService} submitLabel="Delete this service" danger confirmMessage="Delete this service permanently?">
            <input type="hidden" name="id" value={service.id} />
          </AdminForm>
        </div>
      </Card>
    </>
  );
}
