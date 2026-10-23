"use server";

import { redirect } from "next/navigation";
import { getBookingMode } from "@/lib/booking/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const FRIENDLY: Record<string, string> = {
  slot_taken: "Sorry, that time was just booked by someone else. Please choose another slot.",
  outside_hours: "That time is outside the available hours. Please choose another slot.",
  blocked: "That time is not available. Please choose another slot.",
  invalid_time: "That time can no longer be booked. Please choose another slot.",
  service_unavailable: "This consultation is not available for booking right now.",
  too_many_requests:
    "You already have several pending booking requests. Please wait for them to be confirmed, or contact us on WhatsApp.",
};

/**
 * Public booking submission (Server Action = public HTTP endpoint).
 * Defence in depth:
 *   1. honeypot + per-IP rate limit
 *   2. Zod validation of every field (service, time, contact, birth details)
 *   3. ALL business rules re-checked inside the database function create_booking()
 *      (hours, blocked dates, notice window, service snapshot, overlap constraint)
 * Price/duration are NEVER taken from the browser — the DB snapshots them from `services`.
 */
export async function submitBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!getBookingMode().enabled) {
    return { ok: false, message: "Online booking is not available yet. Please contact us on WhatsApp." };
  }

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string | boolean>;
  raw.accept_terms = formData.get("accept_terms") === "on";
  // Echoed back on failure so the browser can refill the form (never includes the honeypot).
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && k !== "website") values[k] = v;
  if (raw.accept_terms === true) values.accept_terms = "on";

  // Honeypot filled → pretend success without doing anything.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { ok: false, message: "Could not submit. Please try again." };
  }

  const ip = await clientIp();
  if (!rateLimit(`book:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again.", values };
  }

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "_form");
      if (!errors[k]) errors[k] = i.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", errors, values };
  }
  const d = parsed.data;

  const sb = createServiceClient();

  // Birth details are required only when the selected service needs them.
  const { data: svc } = await sb
    .from("services")
    .select("requires_birth_details")
    .eq("id", d.service_id)
    .eq("status", "published")
    .maybeSingle();
  if (!svc) return { ok: false, message: FRIENDLY.service_unavailable, values };
  if (svc.requires_birth_details) {
    const errors: Record<string, string> = {};
    if (!d.birth_date) errors.birth_date = "Date of birth is needed to prepare your chart.";
    if (!d.birth_time) errors.birth_time = "Time of birth is needed (approximate is fine; say so in notes).";
    if (!d.birth_place) errors.birth_place = "Place of birth is needed to prepare your chart.";
    if (Object.keys(errors).length) return { ok: false, message: "Please add your birth details.", errors, values };
  }

  const { data, error } = await sb.rpc("create_booking", {
    p_service_id: d.service_id,
    p_starts_at: new Date(d.starts_at).toISOString(),
    p_name: d.name,
    p_email: d.email,
    p_phone: d.phone,
    p_birth_date: d.birth_date ?? null,
    p_birth_time: d.birth_time ?? null,
    p_birth_place: d.birth_place ?? null,
    p_notes: d.notes ?? null,
  });

  if (error) {
    const key = Object.keys(FRIENDLY).find((k) => error.message?.includes(k));
    if (key) return { ok: false, message: FRIENDLY[key], errors: key === "slot_taken" ? { starts_at: "Please pick another time." } : undefined, values };
    console.error("[create_booking]", error.code, error.message);
    return { ok: false, message: "We could not save your booking. Nothing was charged. Please try again or contact us.", values };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.booking_code || !row?.booking_token) {
    console.error("[create_booking] unexpected response", data);
    return { ok: false, message: "We could not confirm your booking. Please check with us before booking again.", values };
  }

  redirect(`/book/confirmation?code=${encodeURIComponent(row.booking_code)}&token=${encodeURIComponent(row.booking_token)}`);
}
