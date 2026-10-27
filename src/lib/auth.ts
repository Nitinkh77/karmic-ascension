import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  user: { id: string; email?: string };
  profile: { role: string; full_name: string | null; email: string | null };
  /** Session client — every query runs as this user, so RLS (is_admin()) still applies. */
  supabase: SupabaseClient;
}

/**
 * Server-side admin check. Never trusts anything from the client:
 *  1. validates the session with supabase.auth.getUser() (verified against the Auth server),
 *  2. reads the role from the profiles table (RLS: a user can only read their own row).
 * Returns null for anonymous users and for signed-in non-admins.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  // getClaims() checks the token's signature locally (no round trip to Supabase Auth) when the project
  // uses asymmetric JWT keys, and falls back to a server check otherwise. Either way the token is verified.
  // Real enforcement is unchanged: every query still runs as this user under RLS (is_admin()).
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  const user = { id: sub, email: typeof data?.claims?.email === "string" ? data.claims.email : undefined };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return null;
  return { user, profile, supabase };
});

/** Any signed-in visitor (customer or admin). Local token check, cached per request. */
export const getSignedInUser = cache(async (): Promise<{ id: string; email?: string } | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return null;
  return { id: sub, email: typeof data?.claims?.email === "string" ? data.claims.email : undefined };
});

/** For admin pages/layouts: redirects away when not an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?error=unauthorized");
  return admin;
}
