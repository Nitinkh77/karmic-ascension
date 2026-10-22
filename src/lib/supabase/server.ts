import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "@/lib/env";

/**
 * Session-aware client (reads the signed-in user's cookies). Uses the public
 * key, so every query is subject to Row Level Security as that user.
 * Admin CRUD uses this client — RLS (is_admin()) is the real enforcement.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are refreshed in proxy.ts instead.
        }
      },
    },
  });
}

/**
 * Cookie-less anonymous client for public content. Because it does not touch
 * cookies(), pages that use it can be statically generated / revalidated.
 */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
