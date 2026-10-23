"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { submitLead } from "@/app/(site)/contact/actions";

/**
 * Enquiry form. Values are kept in state (React 19 clears uncontrolled forms after every
 * action, which would wipe a visitor's text on a validation error).
 */
export function LeadForm({
  source,
  serviceId,
  title = "Send us an enquiry",
  intro = "Tell us a little about what you would like to know and we will get back to you.",
}: {
  source: string;
  serviceId?: string | null;
  title?: string;
  intro?: string;
}) {
  const [state, action, pending] = useActionState(submitLead, null);
  const [v, setV] = useState({ name: "", phone: "", email: "", message: "" });
  const [consent, setConsent] = useState(false);
  const errors = state && !state.ok ? (state.errors ?? {}) : {};
  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  if (state?.ok) {
    return (
      <div role="status" className="ornate-frame rounded-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <h2 className="mt-3 text-2xl text-maroon">Enquiry received</h2>
        <p className="mt-2 text-ink-soft">{state.message}</p>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`lead-${k}-err`} role="alert" className="mt-1 text-sm font-medium text-danger">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form action={action} noValidate className="ornate-frame space-y-5 rounded-2xl p-6 sm:p-8">
      <div>
        <h2 className="font-serif text-2xl text-maroon">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft">{intro}</p>
      </div>
      <input type="hidden" name="source" value={source} />
      {serviceId && <input type="hidden" name="service_id" value={serviceId} />}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state && !state.ok && state.message && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="mb-1.5 block text-sm font-semibold text-charcoal">
            Full name <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input id="lead-name" name="name" className="field" autoComplete="name" required value={v.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "lead-name-err" : undefined} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-semibold text-charcoal">Phone / WhatsApp</label>
          <input id="lead-phone" name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" placeholder="+91 …" value={v.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "lead-phone-err" : undefined} />
          {err("phone")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-email" className="mb-1.5 block text-sm font-semibold text-charcoal">Email</label>
          <input id="lead-email" name="email" type="email" className="field" autoComplete="email" value={v.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "lead-email-err" : undefined} />
          {err("email")}
          <p className="mt-1 text-xs text-ink-soft">Phone or email, at least one, so we can reach you.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-message" className="mb-1.5 block text-sm font-semibold text-charcoal">Your question (optional)</label>
          <textarea id="lead-message" name="message" rows={4} maxLength={1000} className="field" value={v.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "lead-message-err" : undefined} />
          {err("message")}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-[#6b1d2a]" aria-describedby={errors.consent ? "lead-consent-err" : undefined} />
          <span className="text-sm text-charcoal">
            I agree to be contacted about my enquiry, as described in the{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon underline">privacy policy</a>.
          </span>
        </label>
        {err("consent")}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Sending…
          </>
        ) : (
          "Send enquiry"
        )}
      </Button>
    </form>
  );
}
