import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";

export type BookingMode =
  | { enabled: true }
  | { enabled: false; reason: "supabase_missing" | "service_key_missing" };

/**
 * Online booking needs the database AND the server-only service key (used solely
 * for the validated create_booking() call). Without them the site stays usable and
 * visitors are pointed to WhatsApp / e-mail instead.
 */
export function getBookingMode(): BookingMode {
  if (!isSupabaseConfigured) return { enabled: false, reason: "supabase_missing" };
  if (!isServiceRoleConfigured()) return { enabled: false, reason: "service_key_missing" };
  return { enabled: true };
}
