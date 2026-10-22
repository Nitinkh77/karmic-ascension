import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

/**
 * Service-role client. BYPASSES RLS — use ONLY for the two trusted public
 * operations that need it, after server-side validation:
 *   1. create_booking()  (public booking submission)
 *   2. reading one booking by (public_code + access_token) for the confirmation page
 * Never import this from a Client Component. The key never leaves the server.
 */
export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !/YOUR-/i.test(key) && supabaseUrl);
}

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !supabaseUrl) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
