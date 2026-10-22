import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  user: User;
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
export async function getCurrentAdmin(): Promise<AdminContext | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return null;
  return { user, profile, supabase };
}

/** For admin pages/layouts: redirects away when not an admin. */
export async function requireAdmin(): Promise<AdminContext> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?error=unauthorized");
  return admin;
}
