"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { submitBooking } from "@/app/(site)/book/actions";
import { formatDateIst } from "@/lib/booking/slots";
import { bookingSchema } from "@/lib/validation";
import type { Service } from "@/lib/types";
import { cn, formatDuration, formatPrice } from "@/lib/utils";

interface Slot {
  startsAt: string;
  label: string;
}

type Step = 1 | 2 | 3 | 4;

const STEPS: Array<{ n: Step; label: string }> = [
  { n: 1, label: "Service" },
  { n: 2, label: "Date & time" },
  { n: 3, label: "Your details" },
  { n: 4, label: "Review" },
];

/** Which step a server-side field error belongs to, so we can send the customer back to it. */
const FIELD_STEP: Record<string, Step> = {
  service_id: 1,
  starts_at: 2,
  name: 3,
  email: 3,
  phone: 3,
  birth_date: 3,
  birth_time: 3,
  birth_place: 3,
  notes: 3,
  accept_terms: 4,
};

interface Details {
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  notes: string;
}

/** "2026-10-24" → ["Sat", "24 Oct"] (pure calendar date, so no time-zone shift). */
function shortDate(iso: string): [string, string] {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  const wd = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" }).format(dt);
  const rest = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(dt);
  return [wd, rest];
}

const EMPTY: Details = { name: "", phone: "", email: "", birth_date: "", birth_time: "", birth_place: "", notes: "" };

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
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
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function ChangeButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded text-sm font-semibold text-maroon underline underline-offset-2 hover:text-maroon-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
    >
      Change<span className="sr-only"> {label}</span>
    </button>
  );
}

export function BookingForm({
  services,
  initialSlug,
  dates,
  hoursText,
  policyText,
  whatsappHref,
}: {
  services: Service[];
  initialSlug: string | null;
  dates: string[]; // YYYY-MM-DD (IST) that have working hours
  hoursText: string | null;
  policyText: string | null;
  whatsappHref: string | null;
}) {
  const [state, formAction, pending] = useActionState(submitBooking, null);
  const [step, setStep] = useState<Step>(() => (services.some((s) => s.slug === initialSlug) ? 2 : 1));
  const [serviceSlug, setServiceSlug] = useState(() => services.find((s) => s.slug === initialSlug)?.slug ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [startsLabel, setStartsLabel] = useState("");
  const [reload, setReload] = useState(0); // bump to refetch availability
  const [d, setD] = useState<Details>(EMPTY); // controlled, so nothing is lost when React resets the form
  const [accept, setAccept] = useState(false);
  const [edited, setEdited] = useState<Record<string, boolean>>({}); // server error hidden once the field is edited
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const service = useMemo(() => services.find((s) => s.slug === serviceSlug), [services, serviceSlug]);
  const needsBirth = service?.requires_birth_details ?? false;

  const serverErrors = state?.errors ?? {};
  const errors: Record<string, string | undefined> = {};
  for (const k of new Set([...Object.keys(serverErrors), ...Object.keys(clientErrors)])) {
    errors[k] = k in clientErrors ? clientErrors[k] || undefined : edited[k] ? undefined : serverErrors[k];
  }

  // After the server answers: show fresh slots if ours was taken, and send the customer to the step that needs fixing.
  useEffect(() => {
    if (!state) return;
    setEdited({});
    setClientErrors({});
    if (state.errors?.starts_at) {
      setStartsAt("");
      setStartsLabel("");
      setReload((n) => n + 1);
    }
    const steps = Object.keys(state.errors ?? {}).map((k) => FIELD_STEP[k] ?? 4);
    if (steps.length) setStep(Math.min(...steps) as Step);
    else setStep(4);
  }, [state]);

  // Keep the chosen service in the address bar so a refresh or shared link preserves it.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (serviceSlug) url.searchParams.set("service", serviceSlug);
      else url.searchParams.delete("service");
      window.history.replaceState(null, "", url);
    } catch {
      /* non-critical */
    }
  }, [serviceSlug]);

  // Move focus to the step heading when the step changes (not on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Load slots whenever the service or date changes. The server re-checks everything on submit.
  useEffect(() => {
    setStartsAt("");
    setStartsLabel("");
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
  }, [date, serviceSlug, reload]);

  const touch = (name: string) => setEdited((e) => (e[name] ? e : { ...e, [name]: true }));
  const set = (name: keyof Details) => (value: string) => {
    setD((prev) => ({ ...prev, [name]: value }));
    touch(name);
  };

  /** Same Zod rules the server applies. Returns the message, or "" when valid. */
  function check(name: "name" | "email" | "phone", value: string): string {
    const r = bookingSchema.shape[name].safeParse(value);
    return r.success ? "" : (r.error.issues[0]?.message ?? "Invalid value.");
  }
  function validateField(name: "name" | "email" | "phone") {
    const msg = check(name, d[name]);
    setClientErrors((c) => ({ ...c, [name]: msg }));
  }

  function validateDetails(): boolean {
    const found: Record<string, string> = {
      name: check("name", d.name),
      email: check("email", d.email),
      phone: check("phone", d.phone),
    };
    if (needsBirth) {
      if (!d.birth_date) found.birth_date = "Date of birth is needed to prepare your chart.";
      if (!d.birth_time) found.birth_time = "Time of birth is needed (approximate is fine; say so in notes).";
      if (!d.birth_place.trim()) found.birth_place = "Place of birth is needed to prepare your chart.";
    }
    setClientErrors(found);
    return Object.values(found).every((m) => !m);
  }

  function goNext() {
    if (step === 1 && !service) {
      setClientErrors({ service_id: "Please choose a service to continue." });
      return;
    }
    if (step === 2 && !startsAt) {
      setClientErrors({ starts_at: "Please choose a date and time to continue." });
      return;
    }
    if (step === 3 && !validateDetails()) return;
    setClientErrors({});
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  }
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const price = service ? formatPrice(service.price_paise, service.currency) : null;
  const slotsMissing = dates.length === 0;

  const nav = (showBack: boolean, nextLabel: string, nextDisabled = false) => (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showBack ? (
        <Button type="button" variant="secondary" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={goNext} disabled={nextDisabled}>
        {nextLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );

  const panel = (n: Step) => cn("ornate-frame rounded-2xl p-6 sm:p-8", step !== n && "hidden");

  return (
    <form
      action={formAction}
      className={cn("mx-auto w-full space-y-6", step === 1 ? "max-w-5xl" : "max-w-3xl")}
      noValidate
      onSubmit={(e) => {
        // Only step 4 may submit. Pressing Enter on earlier steps just moves forward.
        if (step !== 4) {
          e.preventDefault();
          return;
        }
        if (!accept) {
          e.preventDefault();
          setClientErrors({ accept_terms: "Please accept the terms and policies to continue." });
        }
      }}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement;
        if (e.key === "Enter" && t.tagName === "INPUT" && (t as HTMLInputElement).type !== "checkbox") {
          e.preventDefault();
          if (step < 4) goNext();
        }
      }}
    >
      <input type="hidden" name="service_id" value={service?.id ?? ""} />
      <input type="hidden" name="starts_at" value={startsAt} />
      {/* Honeypot — hidden from people and assistive tech */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Progress */}
      <nav aria-label="Booking progress">
        <ol className="flex items-center justify-between gap-1 sm:gap-2">
          {STEPS.map((s) => {
            const done = s.n < step;
            const current = s.n === step;
            return (
              <li key={s.n} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={current ? "step" : undefined}>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold",
                    current && "border-maroon bg-maroon text-ivory",
                    done && "border-gold bg-gold-soft text-maroon",
                    !current && !done && "border-sand bg-white-warm text-ink-soft",
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : s.n}
                  <span className="sr-only">{done ? " (completed)" : current ? " (current step)" : ""}</span>
                </span>
                <span className={cn("text-xs sm:text-sm", current ? "font-semibold text-maroon" : "text-ink-soft")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {state && !state.ok && state.message && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">
          {state.message}
        </div>
      )}

      {/* Step 1 — service */}
      <section className={panel(1)} aria-labelledby="step-1-title">
        <h2 id="step-1-title" ref={step === 1 ? headingRef : undefined} tabIndex={-1} className="font-serif text-2xl text-maroon outline-none">
          Choose your service
        </h2>
        {initialSlug && !services.some((s) => s.slug === initialSlug) && (
          <p role="status" className="mt-3 rounded-lg bg-saffron-soft p-3 text-sm text-charcoal">
            The service in the link is not available for booking. Please choose one below.
          </p>
        )}
        <div role="radiogroup" aria-label="Services" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const p = formatPrice(s.price_paise, s.currency);
            const checked = s.slug === serviceSlug;
            return (
              <label
                key={s.id}
                className={cn(
                  "flex h-full cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-maroon",
                  checked ? "border-maroon bg-maroon-soft" : "border-sand bg-white-warm hover:border-gold",
                )}
              >
                <input
                  type="radio"
                  name="service_choice"
                  value={s.slug}
                  checked={checked}
                  onChange={() => {
                    setServiceSlug(s.slug);
                    setClientErrors({});
                    touch("service_id");
                  }}
                  className="mt-1.5 h-4 w-4 accent-[#6b1d2a]"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="block font-semibold text-charcoal">{s.title}</span>
                  {s.short_description && <span className="mt-0.5 line-clamp-3 block text-sm text-ink-soft">{s.short_description}</span>}
                  <span className="mt-auto block pt-2 text-sm font-semibold text-maroon">
                    {formatDuration(s.duration_minutes)} · {p ?? "Price on request"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.service_id && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {errors.service_id}
          </p>
        )}
        {nav(false, "Continue", !service)}
      </section>

      {/* Step 2 — date & time */}
      <section className={panel(2)} aria-labelledby="step-2-title">
        <h2 id="step-2-title" ref={step === 2 ? headingRef : undefined} tabIndex={-1} className="font-serif text-2xl text-maroon outline-none">
          Choose a date and time
        </h2>
        {service && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
            <span>
              <strong className="text-charcoal">{service.title}</strong> · {formatDuration(service.duration_minutes)} · {price ?? "Price on request"}
            </span>
            <ChangeButton onClick={() => setStep(1)} label="service" />
          </p>
        )}
        {slotsMissing ? (
          <div className="mt-4 rounded-xl border border-gold bg-saffron-soft p-5 text-charcoal">
            <p className="font-semibold">Online booking times are not open yet.</p>
            <p className="mt-1 text-sm">
              {whatsappHref
                ? "Please message us on WhatsApp and we will arrange a time with you."
                : "Please get in touch with us and we will arrange a time with you."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-maroon px-6 font-semibold text-ivory hover:bg-maroon-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                >
                  WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              <a
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-maroon px-6 font-semibold text-maroon hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
              >
                Contact details
              </a>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              All times are Indian Standard Time (IST).{hoursText ? ` Consultations: ${hoursText}.` : ""}
            </p>
            <div className="mt-5">
              <p id="date-label" className="mb-2 text-sm font-semibold text-charcoal">
                Choose a date <span className="text-danger" aria-hidden="true">*</span>
              </p>
              <div
                role="radiogroup"
                aria-labelledby="date-label"
                className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-sand bg-white-warm p-2 sm:grid-cols-3 md:grid-cols-4"
              >
                {dates.map((x) => {
                  const on = x === date;
                  const [wd, rest] = shortDate(x);
                  return (
                    <button
                      key={x}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={formatDateIst(x)}
                      onClick={() => setDate(x)}
                      className={cn(
                        "flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                        on ? "border-maroon bg-maroon text-ivory" : "border-gold bg-white-warm text-maroon hover:bg-parchment",
                      )}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide opacity-80">{wd}</span>
                      <span className="text-sm font-semibold">{rest}</span>
                    </button>
                  );
                })}
              </div>
              {date && <p className="mt-2 text-sm text-ink-soft">Selected: {formatDateIst(date)}</p>}
            </div>

            {date && (
              <div className="mt-6" aria-live="polite">
                <p className="mb-2 text-sm font-semibold text-charcoal">Available times</p>
                {slots === null && !slotsError && (
                  <p className="flex items-center gap-2 text-ink-soft">
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Checking availability…
                  </p>
                )}
                {slotsError && <p className="text-danger">{slotsError}</p>}
                {slots && slots.length === 0 && (
                  <p className="text-ink-soft">No free times on this date. Please choose another date.</p>
                )}
                {slots && slots.length > 0 && (
                  <div role="radiogroup" aria-label="Available times" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {slots.map((s) => {
                      const on = s.startsAt === startsAt;
                      return (
                        <button
                          key={s.startsAt}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            setStartsAt(s.startsAt);
                            setStartsLabel(s.label);
                            setClientErrors({});
                            touch("starts_at");
                          }}
                          className={cn(
                            "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                            on ? "border-maroon bg-maroon text-ivory" : "border-gold bg-white-warm text-maroon hover:bg-parchment",
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
              <p role="alert" className="mt-3 text-sm font-medium text-danger">
                {errors.starts_at}
              </p>
            )}
            {nav(true, "Continue", !startsAt)}
          </>
        )}
        {slotsMissing && (
          <div className="mt-6">
            <Button type="button" variant="secondary" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </Button>
          </div>
        )}
      </section>

      {/* Step 3 — details */}
      <section className={panel(3)} aria-labelledby="step-3-title">
        <h2 id="step-3-title" ref={step === 3 ? headingRef : undefined} tabIndex={-1} className="font-serif text-2xl text-maroon outline-none">
          Your details
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Full name" required error={errors.name}>
            <input id="name" name="name" className="field" autoComplete="name" required value={d.name} onChange={(e) => set("name")(e.target.value)} onBlur={() => validateField("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
          </Field>
          <Field id="phone" label="Phone / WhatsApp" required error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" placeholder="+91 …" required value={d.phone} onChange={(e) => set("phone")(e.target.value)} onBlur={() => validateField("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : undefined} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="email" label="Email" required error={errors.email}>
              <input id="email" name="email" type="email" className="field" autoComplete="email" required value={d.email} onChange={(e) => set("email")(e.target.value)} onBlur={() => validateField("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
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
                <input id="birth_date" name="birth_date" type="date" max={new Date().toISOString().slice(0, 10)} value={d.birth_date} onChange={(e) => set("birth_date")(e.target.value)} className="field" aria-invalid={!!errors.birth_date} aria-describedby={errors.birth_date ? "birth_date-err" : undefined} />
              </Field>
              <Field id="birth_time" label="Time of birth" required error={errors.birth_time}>
                <input id="birth_time" name="birth_time" type="time" value={d.birth_time} onChange={(e) => set("birth_time")(e.target.value)} className="field" aria-invalid={!!errors.birth_time} aria-describedby={errors.birth_time ? "birth_time-err" : undefined} />
              </Field>
              <Field id="birth_place" label="Place of birth" required error={errors.birth_place}>
                <input id="birth_place" name="birth_place" value={d.birth_place} onChange={(e) => set("birth_place")(e.target.value)} className="field" placeholder="City, State, Country" aria-invalid={!!errors.birth_place} aria-describedby={errors.birth_place ? "birth_place-err" : undefined} />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Field id="notes" label="Your question or notes (optional)" error={errors.notes}>
            <textarea id="notes" name="notes" rows={3} maxLength={1000} value={d.notes} onChange={(e) => set("notes")(e.target.value)} className="field" />
          </Field>
        </div>
        {nav(true, "Review booking")}
      </section>

      {/* Step 4 — review & confirm */}
      <section className={panel(4)} aria-labelledby="step-4-title">
        <h2 id="step-4-title" ref={step === 4 ? headingRef : undefined} tabIndex={-1} className="font-serif text-2xl text-maroon outline-none">
          Review and confirm
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-4 text-charcoal sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Service</dt>
            <dd className="flex flex-wrap items-baseline gap-x-3">
              {service?.title ?? "—"} <ChangeButton onClick={() => setStep(1)} label="service" />
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Price</dt>
            <dd>{price ?? "Price on request — we will confirm before payment"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Duration</dt>
            <dd>{service ? formatDuration(service.duration_minutes) : "—"}</dd>
          </div>
          <div>
            <dt className="eyebrow">When (IST)</dt>
            <dd className="flex flex-wrap items-baseline gap-x-3">
              {startsAt ? `${formatDateIst(date)} · ${startsLabel}` : "Not chosen yet"}{" "}
              <ChangeButton onClick={() => setStep(2)} label="date and time" />
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Name</dt>
            <dd className="flex flex-wrap items-baseline gap-x-3">
              {d.name || "—"} <ChangeButton onClick={() => setStep(3)} label="details" />
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Phone</dt>
            <dd>{d.phone || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="eyebrow">Email</dt>
            <dd className="break-all">{d.email || "—"}</dd>
          </div>
          {needsBirth && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Birth details</dt>
              <dd>{[d.birth_date, d.birth_time, d.birth_place].filter(Boolean).join(" · ") || "—"}</dd>
            </div>
          )}
          {d.notes && (
            <div className="sm:col-span-2">
              <dt className="eyebrow">Notes</dt>
              <dd className="whitespace-pre-line">{d.notes}</dd>
            </div>
          )}
        </dl>

        <p className="mt-6 rounded-lg bg-parchment p-4 text-sm text-ink-soft">
          <strong className="text-charcoal">Payment is not taken on this website yet.</strong> After you confirm, you will
          see how to pay (UPI / Paytm / PhonePe). Your booking stays <em>pending</em> until the payment is verified and
          the booking is confirmed.
        </p>
        {policyText && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{policyText}</p>}

        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="accept_terms"
              checked={accept}
              onChange={(e) => {
                setAccept(e.target.checked);
                setClientErrors({});
                touch("accept_terms");
              }}
              className="mt-1 h-5 w-5 accent-[#6b1d2a]"
              aria-describedby={errors.accept_terms ? "terms-err" : undefined}
            />
            <span className="text-sm text-charcoal">
              I have read and agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon underline">terms</a>,{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon underline">privacy policy</a> and{" "}
              <a href="/cancellation-refund" target="_blank" rel="noopener noreferrer" className="font-semibold text-maroon underline">cancellation &amp; rescheduling policy</a>.
            </span>
          </label>
          {errors.accept_terms && (
            <p id="terms-err" role="alert" className="mt-1 text-sm font-medium text-danger">
              {errors.accept_terms}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" onClick={goBack} disabled={pending}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Button>
          <Button type="submit" size="lg" disabled={pending || !startsAt || !service}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Submitting…
              </>
            ) : (
              "Confirm booking"
            )}
          </Button>
        </div>
      </section>
    </form>
  );
}
