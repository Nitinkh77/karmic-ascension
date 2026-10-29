import { AdminForm, Card, Check, Field, PageTitle } from "@/components/admin/ui";
import { saveSettings } from "@/app/admin/(panel)/actions";
import { requireAdmin } from "@/lib/auth";
import { emailConfigured } from "@/lib/notify";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s = (data ?? DEFAULT_SETTINGS) as SiteSettings;
  const v = (x: string | number | null | undefined) => x ?? "";
  const rowMissing = !data;

  return (
    <>
      <PageTitle title="Settings" description="Brand, contact details, payment instructions, booking policy and SEO defaults." />
      {rowMissing && (
        <p role="alert" className="mb-6 rounded-xl border border-danger/40 bg-red-50 p-4 text-sm text-danger">
          No settings row exists in the database yet — run <code>supabase/seed.sql</code>. Saving will fail until then.
        </p>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 text-xl text-maroon">Integration status</h2>
        <ul className="space-y-1.5 text-sm">
          <li><strong>Supabase database &amp; auth:</strong> connected (you are signed in).</li>
          <li><strong>Public booking (server key):</strong> {isServiceRoleConfigured() ? "configured" : <span className="font-semibold text-danger">SUPABASE_SERVICE_ROLE_KEY missing — online booking is disabled</span>}</li>
          <li><strong>Online payments (Razorpay):</strong> not enabled — manual payment is used. A booking is paid only when you mark it so.</li>
          <li><strong>New-booking e-mail alerts:</strong> {emailConfigured() ? "on: you and the customer are e-mailed for every new booking." : <span>off. Add <code>RESEND_API_KEY</code> in Vercel to switch them on (see the README).</span>}</li>
          <li><strong>WhatsApp:</strong> one-click message buttons are on each booking (WhatsApp opens with the text ready; you press Send).</li>
        </ul>
        <p className="mt-3 text-xs text-ink-soft">Time zone is fixed to Asia/Kolkata (IST).</p>
      </Card>

      <AdminForm action={saveSettings} submitLabel="Save settings" className="space-y-6">
        <Card>
          <h2 className="mb-4 text-xl text-maroon">Brand</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Brand name" name="brand_name"><input id="brand_name" name="brand_name" defaultValue={s.brand_name} required className="field" /></Field>
            <Field label="Tagline" name="tagline"><input id="tagline" name="tagline" defaultValue={s.tagline} className="field" /></Field>
          </div>
          <div className="mt-5"><Field label="Short description" name="description"><textarea id="description" name="description" rows={2} defaultValue={s.description} className="field" /></Field></div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Contact</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" name="contact_email"><input id="contact_email" name="contact_email" type="email" defaultValue={v(s.contact_email)} className="field" /></Field>
            <Field label="Phone" name="contact_phone"><input id="contact_phone" name="contact_phone" defaultValue={v(s.contact_phone)} className="field" /></Field>
            <Field label="WhatsApp number" name="whatsapp_number" hint="Digits with country code, e.g. 918736066349"><input id="whatsapp_number" name="whatsapp_number" defaultValue={v(s.whatsapp_number)} className="field" /></Field>
            <Field label="Location" name="address"><input id="address" name="address" defaultValue={v(s.address)} className="field" /></Field>
            <div className="sm:col-span-2"><Field label="Consultation hours (text shown on the site)" name="hours_text" hint="Display only. Real bookable hours are set in Availability."><input id="hours_text" name="hours_text" defaultValue={v(s.hours_text)} className="field" /></Field></div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Social links</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Instagram URL" name="instagram_url"><input id="instagram_url" name="instagram_url" type="url" defaultValue={v(s.instagram_url)} className="field" /></Field>
            <Field label="Facebook URL" name="facebook_url"><input id="facebook_url" name="facebook_url" type="url" defaultValue={v(s.facebook_url)} className="field" /></Field>
            <Field label="YouTube URL" name="youtube_url"><input id="youtube_url" name="youtube_url" type="url" defaultValue={v(s.youtube_url)} className="field" /></Field>
            <Field label="AstroSage profile URL" name="astrosage_url" hint="The existing site links to an AstroSage profile; the URL was not available, so add it here."><input id="astrosage_url" name="astrosage_url" type="url" defaultValue={v(s.astrosage_url)} className="field" /></Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Alerts &amp; reviews</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Alert e-mail (new bookings are sent here)" name="notify_email" hint="Leave empty to use the contact e-mail above.">
              <input id="notify_email" name="notify_email" type="email" defaultValue={v(s.notify_email)} className="field" />
            </Field>
            <Field label="Google Business Profile link" name="google_business_url" hint="Open the business on Google Maps → Share → copy the link. Shown on the Contact page and footer as “Find us on Google”.">
              <input id="google_business_url" name="google_business_url" type="url" defaultValue={v(s.google_business_url)} className="field" placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <Field label="Google review link" name="google_review_url" hint="Google Business Profile → “Ask for reviews” → copy the link. Used by the review-request button on completed bookings.">
              <input id="google_review_url" name="google_review_url" type="url" defaultValue={v(s.google_review_url)} className="field" placeholder="https://g.page/r/…/review" />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Manual payment details</h2>
          <p className="mb-4 text-sm text-ink-soft">Shown to customers on the booking confirmation page.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Paytm / PhonePe number" name="paytm_phonepe_number"><input id="paytm_phonepe_number" name="paytm_phonepe_number" defaultValue={v(s.paytm_phonepe_number)} className="field" /></Field>
            <Field label="GPay UPI ID" name="gpay_upi_id"><input id="gpay_upi_id" name="gpay_upi_id" defaultValue={v(s.gpay_upi_id)} className="field" /></Field>
          </div>
          <div className="mt-5"><Field label="Extra payment instructions (optional)" name="payment_instructions"><textarea id="payment_instructions" name="payment_instructions" rows={3} defaultValue={v(s.payment_instructions)} className="field" /></Field></div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Booking rules &amp; policy</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Slot spacing (min)" name="slot_minutes"><input id="slot_minutes" name="slot_minutes" type="number" defaultValue={s.slot_minutes} className="field" /></Field>
            <Field label="Buffer (min)" name="buffer_minutes"><input id="buffer_minutes" name="buffer_minutes" type="number" defaultValue={s.buffer_minutes} className="field" /></Field>
            <Field label="Minimum notice (h)" name="min_notice_hours"><input id="min_notice_hours" name="min_notice_hours" type="number" defaultValue={s.min_notice_hours} className="field" /></Field>
            <Field label="Max days ahead" name="max_advance_days"><input id="max_advance_days" name="max_advance_days" type="number" defaultValue={s.max_advance_days} className="field" /></Field>
          </div>
          <div className="mt-5"><Field label="Booking policy note (shown on the booking form)" name="booking_policy_text"><textarea id="booking_policy_text" name="booking_policy_text" rows={3} defaultValue={v(s.booking_policy_text)} className="field" /></Field></div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">Announcement bar &amp; footer</h2>
          <div className="space-y-4">
            <Check name="announcement_active" label="Show the announcement bar" defaultChecked={s.announcement_active} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Announcement text" name="announcement_text"><input id="announcement_text" name="announcement_text" defaultValue={v(s.announcement_text)} className="field" /></Field>
              <Field label="Announcement link (optional)" name="announcement_href"><input id="announcement_href" name="announcement_href" defaultValue={v(s.announcement_href)} className="field" placeholder="/book" /></Field>
            </div>
            <Field label="Footer text" name="footer_text" hint="Start with © to have the current year inserted automatically."><input id="footer_text" name="footer_text" defaultValue={v(s.footer_text)} className="field" /></Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl text-maroon">SEO defaults</h2>
          <div className="space-y-5">
            <Field label="Home page title" name="seo_title"><input id="seo_title" name="seo_title" defaultValue={v(s.seo_title)} className="field" maxLength={120} /></Field>
            <Field label="Default meta description" name="seo_description"><textarea id="seo_description" name="seo_description" rows={2} defaultValue={v(s.seo_description)} className="field" maxLength={300} /></Field>
          </div>
        </Card>
      </AdminForm>
    </>
  );
}
