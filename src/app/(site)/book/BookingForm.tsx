"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { submitBooking } from "@/app/(site)/book/actions";
import { formatDateIst } from "@/lib/booking/slots";
import type { Service } from "@/lib/types";
import { cn, formatDuration, formatPrice } from "@/lib/utils";

interface Slot {
  startsAt: string;
  label: string;
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-charcoal">
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function BookingForm({
  services,
  initialSlug,
  dates,
  hoursText,
  policyText,
}: {
  services: Service[];
  initialSlug: string | null;
  dates: string[]; // YYYY-MM-DD (IST) that have working hours
  hoursText: string | null;
  policyText: string | null;
}) {
  const [state, formAction, pending] = useActionState(submitBooking, null);
  const [serviceSlug, setServiceSlug] = useState(
    services.find((s) => s.slug === initialSlug)?.slug ?? services[0]?.slug ?? "",
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");

  const service = useMemo(() => services.find((s) => s.slug === serviceSlug), [services, serviceSlug]);
  const errors = state?.errors ?? {};

  // Load slots whenever the service or date changes. The server re-checks everything on submit.
  useEffect(() => {
    setStartsAt("");
    setSlots(null);
    setSlotsError(null);
    if (!date || !serviceSlug) return;
    const ctrl = new AbortController();
    fetch(`/api/slots?service=${encodeURIComponent(serviceSlug)}&date=${date}`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load times.");
        setSlots(j.slots as Slot[]);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setSlotsError(e.message || "Could not load times.");
      });
    return () => ctrl.abort();
  }, [date, serviceSlug]);

  if (!service) return null;
  const price = formatPrice(service.price_paise, service.currency);
  const needsBirth = service.requires_birth_details;

  return (
    <form action={formAction} className="space-y-10" noValidate>
      <input type="hidden" name="service_id" value={service.id} />
      <input type="hidden" name="starts_at" value={startsAt} />
      {/* Honeypot — hidden from people and assistive tech */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state && !state.ok && state.message && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">
          {state.message}
        </div>
      )}

      {/* 1 — consultation */}
      <fieldset className="ornate-frame rounded-2xl p-6 sm:p-8">
        <legend className="px-2 font-serif text-2xl text-maroon">1 · Consultation</legend>
        <div className="mt-2 space-y-3">
          {services.map((s) => {
            const p = formatPrice(s.price_paise, s.currency);
            const checked = s.slug === serviceSlug;
            return (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                  checked ? "border-maroon bg-maroon-soft" : "border-sand bg-white-warm hover:border-gold",
                )}
              >
                <input
                  type="radio"
                  name="service_choice"
                  value={s.slug}
                  checked={checked}
                  onChange={() => setServiceSlug(s.slug)}
                  className="mt-1.5 h-4 w-4 accent-[#6b1d2a]"
                />
                <span className="flex-1">
                  <span className="block font-semibold text-charcoal">{s.title}</span>
                  <span className="block text-sm text-ink-soft">
                    {formatDuration(s.duration_minutes)} · {p ?? "Price on request"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.service_id && <p role="alert" className="mt-2 text-sm font-medium text-danger">{errors.service_id}</p>}
      </fieldset>

      {/* 2 — date & time */}
      <fieldset className="ornate-frame rounded-2xl p-6 sm:p-8">
        <legend className="px-2 font-serif text-2xl text-maroon">2 · Date and time</legend>
        {dates.length === 0 ? (
          <p className="mt-2 rounded-lg bg-saffron-soft p-4 text-charcoal">
            No working days have been set up yet, so online booking is not open. Please contact us on WhatsApp to
            arrange a time.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-soft">
              All times are Indian Standard Time (IST).{hoursText ? ` Consultations: ${hoursText}.` : ""}
            </p>
            <div className="mt-4">
              <Field id="date" label="Choose a date" required>
                <select
                  id="date"
                  className="field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-describedby={errors.starts_at ? "date-err" : undefined}
                >
                  <option value="">Select a date…</option>
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {formatDateIst(d)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {date && (
              <div className="mt-6" aria-live="polite">
                <p className="mb-2 text-sm font-semibold text-charcoal">Available times</p>
                {slots === null && !slotsError && (
                  <p className="flex items-center gap-2 text-ink-soft">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking availability…
                  </p>
                )}
                {slotsError && <p className="text-danger">{slotsError}</p>}
                {slots && slots.length === 0 && (
                  <p className="text-ink-soft">No free times on this date. Please choose another date.</p>
                )}
                {slots && slots.length > 0 && (
                  <div role="radiogroup" aria-label="Available times" className="flex flex-wrap gap-2">
                    {slots.map((s) => {
                      const on = s.startsAt === startsAt;
                      return (
                        <button
                          key={s.startsAt}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setStartsAt(s.startsAt)}
                          className={cn(
                            "min-h-11 min-w-24 rounded-full border px-4 text-sm font-semibold transition-colors",
                            on
                              ? "border-maroon bg-maroon text-ivory"
                              : "border-gold bg-white-warm text-maroon hover:bg-parchment",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {errors.starts_at && (
              <p id="date-err" role="alert" className="mt-3 text-sm font-medium text-danger">
                {errors.starts_at}
              </p>
            )}
          </>
        )}
      </fieldset>

      {/* 3 — details */}
      <fieldset className="ornate-frame rounded-2xl p-6 sm:p-8">
        <legend className="px-2 font-serif text-2xl text-maroon">3 · Your details</legend>
        <div className="mt-2 grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Full name" required error={errors.name}>
            <input id="name" name="name" className="field" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
          </Field>
          <Field id="phone" label="Phone / WhatsApp" required error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" placeholder="+91 …" required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : undefined} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="email" label="Email" required error={errors.email}>
              <input id="email" name="email" type="email" className="field" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
            </Field>
          </div>
        </div>

        {needsBirth && (
          <div className="mt-8 border-t border-sand pt-6">
            <h3 className="font-serif text-xl text-maroon">Birth details</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Vedic astrology reads your birth chart, which is calculated from the exact date, time and place you were
              born. We use these only to prepare your consultation.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <Field id="birth_date" label="Date of birth" required error={errors.birth_date}>
                <input id="birth_date" name="birth_date" type="date" max={new Date().toISOString().slice(0, 10)} className="field" aria-invalid={!!errors.birth_date} aria-describedby={errors.birth_date ? "birth_date-err" : undefined} />
              </Field>
              <Field id="birth_time" label="Time of birth" required error={errors.birth_time}>
                <input id="birth_time" name="birth_time" type="time" className="field" aria-invalid={!!errors.birth_time} aria-describedby={errors.birth_time ? "birth_time-err" : undefined} />
              </Field>
              <Field id="birth_place" label="Place of birth" required error={errors.birth_place}>
                <input id="birth_place" name="birth_place" className="field" placeholder="City, State, Country" aria-invalid={!!errors.birth_place} aria-describedby={errors.birth_place ? "birth_place-err" : undefined} />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Field id="notes" label="Anything you would like us to know (optional)" error={errors.notes}>
            <textarea id="notes" name="notes" rows={3} maxLength={1000} className="field" />
          </Field>
        </div>
      </fieldset>

      {/* 4 — review */}
      <fieldset className="ornate-frame rounded-2xl p-6 sm:p-8">
        <legend className="px-2 font-serif text-2xl text-maroon">4 · Review and submit</legend>
        <dl className="mt-2 grid gap-3 text-charcoal sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Consultation</dt>
            <dd>{service.title}</dd>
          </div>
          <div>
            <dt className="eyebrow">Price</dt>
            <dd>{price ?? "Price on request — we will confirm before payment"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Duration</dt>
            <dd>{formatDuration(service.duration_minutes)}</dd>
          </div>
          <div>
            <dt className="eyebrow">When (IST)</dt>
            <dd>
              {startsAt
                ? `${formatDateIst(date)} · ${slots?.find((s) => s.startsAt === startsAt)?.label ?? ""}`
                : "Not chosen yet"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 rounded-lg bg-parchment p-4 text-sm text-ink-soft">
          <strong className="text-charcoal">Payment is not taken on this website yet.</strong> After you submit, you will
          see how to pay (UPI / Paytm / PhonePe). Your booking stays <em>pending</em> until the payment is verified and
          the booking is confirmed.
        </p>
        {policyText && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{policyText}</p>}

        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="accept_terms" className="mt-1 h-5 w-5 accent-[#6b1d2a]" aria-describedby={errors.accept_terms ? "terms-err" : undefined} />
            <span className="text-sm text-charcoal">
              I have read and agree to the{" "}
              <a href="/terms" target="_blank" className="font-semibold text-maroon underline">terms</a>,{" "}
              <a href="/privacy" target="_blank" className="font-semibold text-maroon underline">privacy policy</a> and{" "}
              <a href="/cancellation-refund" target="_blank" className="font-semibold text-maroon underline">cancellation &amp; rescheduling policy</a>.
            </span>
          </label>
          {errors.accept_terms && (
            <p id="terms-err" role="alert" className="mt-1 text-sm font-medium text-danger">
              {errors.accept_terms}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={pending || !startsAt}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting…
            </>
          ) : (
            "Submit booking request"
          )}
        </Button>
        {!startsAt && <p className="mt-2 text-sm text-ink-soft">Choose a date and time to continue.</p>}
      </fieldset>
    </form>
  );
}
