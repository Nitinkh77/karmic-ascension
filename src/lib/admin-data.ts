import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaPublicUrl } from "@/lib/data";
import type { Booking, MediaAsset } from "@/lib/types";

/** Admin queries run through the signed-in admin's session client → RLS applies. */

export async function listMedia(sb: SupabaseClient): Promise<MediaAsset[]> {
  const { data } = await sb.from("media_assets").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((m) => ({ ...m, url: mediaPublicUrl(m.storage_path) ?? "" })) as MediaAsset[];
}

export const BOOKING_COLUMNS =
  "id, public_code, service_id, service_title, service_price_paise, currency, duration_minutes, customer_name, customer_email, customer_phone, birth_date, birth_time, birth_place, customer_notes, starts_at, ends_at, status, payment_status, payment_method, admin_notes, created_at";

export type { Booking };

export function parseBookingFilters(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const status = ["pending", "confirmed", "cancelled", "completed"].includes(one("status")) ? one("status") : "";
  const payment = ["unpaid", "pending_verification", "paid", "refunded", "waived"].includes(one("payment"))
    ? one("payment")
    : "";
  const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
  return {
    q: one("q").trim().slice(0, 80),
    status,
    payment,
    service: /^[0-9a-f-]{36}$/i.test(one("service")) ? one("service") : "",
    from: isDate(one("from")) ? one("from") : "",
    to: isDate(one("to")) ? one("to") : "",
  };
}
