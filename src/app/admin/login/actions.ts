"use server";

import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { loginSchema } from "@/lib/validation";

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is not configured yet. See the README." };

  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 8, 10 * 60_000)) {
    return { ok: false, message: "Too many sign-in attempts. Please wait a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join(".")] ||= i.message;
    return { ok: false, errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Generic message: do not reveal whether the e-mail exists.
  if (error) return { ok: false, message: "Incorrect email or password." };

  // Signed in is not enough: the account must have the admin role.
  const admin = await getCurrentAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account does not have administrator access." };
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
