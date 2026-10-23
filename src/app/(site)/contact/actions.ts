"use server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { ActionState } from "@/lib/types";
import { leadSchema } from "@/lib/validation";

/**
 * Public enquiry submission (a Server Action is a public HTTP endpoint).
 * Honeypot → per-IP rate limit → Zod → create_lead() in Postgres, which re-checks consent,
 * contact details and a durable 3-per-24h limit per email/phone. Nothing is ever reported
 * as sent unless the database confirmed the insert.
 */
export async function submitLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return { ok: false, message: "Enquiries are not available yet. Please contact us on WhatsApp or by phone." };
  }

  const raw: Record<string, string | boolean> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  raw.consent = formData.get("consent") === "on";

  // Bots fill the hidden field. Answer as if it worked, store nothing.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { ok: true, message: "Thank you. We will be in touch soon." };
  }

  const ip = await clientIp();
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "_form");
      if (!errors[k]) errors[k] = i.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }
  const d = parsed.data;

  const sb = createServiceClient();
  const { error } = await sb.rpc("create_lead", {
    p_name: d.name,
    p_email: d.email ?? null,
    p_phone: d.phone ?? null,
    p_message: d.message ?? null,
    p_service_id: d.service_id ?? null,
    p_source: d.source ?? "website",
    p_consent: true,
  });

  if (error) {
    if (error.message?.includes("too_many_requests")) {
      return { ok: false, message: "We already have your recent enquiries and will reply soon. Please avoid sending more for now." };
    }
    console.error("[create_lead]", error.code, error.message);
    return { ok: false, message: "We could not save your enquiry. Please try again, or contact us on WhatsApp." };
  }
  return { ok: true, message: "Thank you! Your enquiry has reached us. We will contact you soon." };
}
