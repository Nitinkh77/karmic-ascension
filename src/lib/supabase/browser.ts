import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "@/lib/env";

/** Browser client, used only for "Continue with Google" and the Sign in / Sign out button. */
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
