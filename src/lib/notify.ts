import "server-only";
import { formatDateTimeIst } from "@/lib/booking/slots";
import { siteUrl } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/admin";
import { formatPrice, whatsappLink } from "@/lib/utils";

/**
 * New-booking e-mail alerts, sent through Resend (https://resend.com, free tier).
 *   RESEND_API_KEY      required, otherwise nothing is sent (the booking still works)
 *   NOTIFY_FROM_EMAIL   e.g. "Karmic Ascension <bookings@neelabhshivam.com>" (a domain verified in Resend)
 *   ADMIN_NOTIFY_EMAIL  optional override for the alert address (otherwise Settings → alert email → contact email)
 * Every failure is logged and swallowed: an e-mail problem must never break a booking.
 */

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string | null }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || "Karmic Ascension <onboarding@resend.dev>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[notify] Resend rejected the e-mail", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] e-mail failed", e);
    return false;
  }
}

const row = (k: string, v: string | null | undefined) =>
  v ? `<tr><td style="padding:6px 12px 6px 0;color:#6b6b6b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#222">${esc(v)}</td></tr>` : "";

const shell = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#faf6ee;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#6b1d2a;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;font-size:18px">${esc(title)}</div>
<div style="background:#fff;padding:22px;border:1px solid #e9dec5;border-top:0;border-radius:0 0 12px 12px;font-size:15px;line-height:1.5">${inner}</div>
<p style="color:#8a8a8a;font-size:12px;text-align:center">Karmic Ascension – Vedic Astrology™</p>
</div></body></html>`;

const button = (href: string, label: string) =>
  `<p style="margin:20px 0 0"><a href="${esc(href)}" style="background:#6b1d2a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;display:inline-block;font-weight:bold">${esc(label)}</a></p>`;

/** Sends the admin alert and the customer confirmation for a booking that was just created. */
export async function notifyNewBooking(bookingId: string, accessToken: string): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const sb = createServiceClient();
    const [{ data: b }, { data: s }] = await Promise.all([
      sb
        .from("bookings")
        .select(
          "id, public_code, service_title, service_price_paise, currency, duration_minutes, customer_name, customer_email, customer_phone, birth_date, birth_time, birth_place, customer_notes, starts_at",
        )
        .eq("id", bookingId)
        .maybeSingle(),
      sb.from("site_settings").select("contact_email, notify_email, whatsapp_number, paytm_phonepe_number, gpay_upi_id, payment_instructions").eq("id", 1).maybeSingle(),
    ]);
    if (!b) return;

    const when = `${formatDateTimeIst(b.starts_at)} IST`;
    const price = formatPrice(b.service_price_paise, b.currency) ?? "Price on request";
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL || s?.notify_email || s?.contact_email;
    const stamp: Record<string, string> = {};

    if (adminTo) {
      const wa = whatsappLink(b.customer_phone.length === 10 ? `91${b.customer_phone}` : b.customer_phone, `Namaste ${b.customer_name}, regarding your booking ${b.public_code}.`);
      const ok = await sendEmail({
        to: adminTo,
        replyTo: b.customer_email,
        subject: `New booking: ${b.service_title} · ${b.customer_name} · ${when}`,
        html: shell(
          "New booking received",
          `<table style="border-collapse:collapse;width:100%">
            ${row("Reference", b.public_code)}${row("Service", `${b.service_title} (${b.duration_minutes} min)`)}${row("Price", price)}${row("When", when)}
            ${row("Name", b.customer_name)}${row("Phone", b.customer_phone)}${row("Email", b.customer_email)}
            ${row("Date of birth", b.birth_date)}${row("Time of birth", b.birth_time)}${row("Place of birth", b.birth_place)}
            ${row("Customer note", b.customer_notes)}
          </table>
          ${button(`${siteUrl}/admin/bookings/${b.id}`, "Open booking in admin")}
          ${wa ? `<p style="margin:14px 0 0"><a href="${esc(wa)}" style="color:#6b1d2a">Message the customer on WhatsApp</a></p>` : ""}`,
        ),
      });
      if (ok) stamp.notified_admin_at = new Date().toISOString();
    } else {
      console.error("[notify] no admin alert address: set Settings → Alert email or ADMIN_NOTIFY_EMAIL");
    }

    const pay = [
      s?.paytm_phonepe_number && `Paytm / PhonePe: ${s.paytm_phonepe_number}`,
      s?.gpay_upi_id && `GPay UPI: ${s.gpay_upi_id}`,
      s?.payment_instructions,
    ].filter(Boolean) as string[];
    const okC = await sendEmail({
      to: b.customer_email,
      replyTo: adminTo,
      subject: `Your booking request ${b.public_code} · Karmic Ascension`,
      html: shell(
        "We have received your booking",
        `<p>Namaste ${esc(b.customer_name)},</p>
         <p>Thank you for booking with Karmic Ascension. Your request is <strong>pending confirmation</strong>: we will confirm it personally.</p>
         <table style="border-collapse:collapse;width:100%">
           ${row("Reference", b.public_code)}${row("Consultation", `${b.service_title} (${b.duration_minutes} min)`)}${row("When", when)}${row("Fee", price)}
         </table>
         ${pay.length ? `<p style="margin-top:16px"><strong>Payment</strong><br>${pay.map(esc).join("<br>")}</p>` : ""}
         ${button(`${siteUrl}/book/confirmation?code=${encodeURIComponent(b.public_code)}&token=${encodeURIComponent(accessToken)}`, "View your booking")}`,
      ),
    });
    if (okC) stamp.notified_customer_at = new Date().toISOString();

    if (Object.keys(stamp).length) {
      const { error } = await sb.from("bookings").update(stamp).eq("id", b.id);
      if (error) console.error("[notify] could not record notification time (run the latest migration):", error.message);
    }
  } catch (e) {
    console.error("[notify] failed", e);
  }
}
