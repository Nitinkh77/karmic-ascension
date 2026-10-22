import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, PageTitle } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { listMedia } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  const { supabase } = await requireAdmin();
  const assets = await listMedia(supabase);
  return (
    <>
      <Link href="/admin/services" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All services
      </Link>
      <PageTitle title="New service" />
      <Card><ServiceForm assets={assets} /></Card>
    </>
  );
}
