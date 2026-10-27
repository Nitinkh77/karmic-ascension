"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { safeNext } from "@/lib/utils";

const base = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().max(300).optional(),
});
const signUpSchema = base.extend({ password: z.string().min(8, "Use at least 8 characters.").max(200) });

function fieldErrors(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>) {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[i.path.map(String).join(".")] ||= i.message;
  return errors;
}

export async function customerSignIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Sign-in is not set up yet." };
  if (!rateLimit(`csignin:${await clientIp()}`, 10, 10 * 60_000)) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  }
  const parsed = base.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    const unconfirmed = /confirm/i.test(error.message);
    return {
      ok: false,
      message: unconfirmed ? "Please confirm your email first. Check your inbox for the link." : "Incorrect email or password.",
    };
  }
  redirect(safeNext(parsed.data.next));
}

export async function customerSignUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Sign-up is not set up yet." };
  if (!rateLimit(`csignup:${await clientIp()}`, 5, 60 * 60_000)) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const next = safeNext(parsed.data.next);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: origin ? { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } : undefined,
  });
  if (error) return { ok: false, message: "We could not create the account. Try signing in, or use a different email." };
  // With e-mail confirmation on, there is no session yet. Say so instead of pretending the user is signed in.
  if (!data.session) {
    return { ok: true, message: "Account created. Check your email and open the link to confirm, then sign in." };
  }
  redirect(next);
}
