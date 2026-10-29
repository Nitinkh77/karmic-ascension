"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import type { MatchResult } from "@/lib/astro/matching";

interface Place {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
interface PersonInput {
  name: string;
  date: string;
  time: string;
  place: Place | null;
}
interface Summary {
  name: string | null;
  place: string;
  summary: { lagna: string; moonSign: string; moonSignEnglish: string; nakshatra: string; pada: number };
  manglik: { house: number; is: boolean };
}
interface Result {
  groom: Summary;
  bride: Summary;
  match: MatchResult;
}

const EMPTY: PersonInput = { name: "", date: "", time: "", place: null };

/** Birth place box with suggestions (same /api/places service as the kundali tool). */
function PlaceField({ id, value, onPick }: { id: string; value: Place | null; onPick: (p: Place | null) => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value || query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`, { signal: ctl.signal });
        const data = (await res.json()) as { places?: Place[] };
        setOptions(data.places ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, value]);

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">Place of birth</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          required
          placeholder="Start typing a city"
          className="field !pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onPick(null);
          }}
          onFocus={() => options.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-sand bg-white-warm py-1 shadow-lift">
          {options.map((o) => (
            <li key={`${o.label}-${o.latitude}`} role="option" aria-selected={false}>
              <button
                type="button"
                className="block min-h-11 w-full px-4 py-2 text-left text-sm hover:bg-parchment"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(o);
                  setQuery(o.label);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && <p className="mt-1.5 text-xs text-ink-soft">Time zone {value.timezone}</p>}
    </div>
  );
}

function PersonCard({
  title,
  hint,
  value,
  onChange,
  today,
}: {
  title: string;
  hint: string;
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  today: string;
}) {
  const uid = useId();
  return (
    <fieldset className="ornate-frame min-w-0 rounded-2xl p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-serif text-2xl text-maroon" aria-hidden="true">{title}</h2>
      <p className="mb-4 text-sm text-ink-soft">{hint}</p>
      <div className="grid gap-4">
        <div>
          <label htmlFor={`${uid}-n`} className="mb-1.5 block text-sm font-semibold">Name <span className="font-normal text-ink-soft">(optional)</span></label>
          <input id={`${uid}-n`} className="field" maxLength={80} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-d`} className="mb-1.5 block text-sm font-semibold">Date of birth</label>
            <input id={`${uid}-d`} type="date" required className="field" value={value.date} max={today} min="1800-01-01" onChange={(e) => onChange({ ...value, date: e.target.value })} />
          </div>
          <div>
            <label htmlFor={`${uid}-t`} className="mb-1.5 block text-sm font-semibold">Time of birth</label>
            <input id={`${uid}-t`} type="time" required className="field" value={value.time} onChange={(e) => onChange({ ...value, time: e.target.value })} />
          </div>
        </div>
        <PlaceField id={`${uid}-p`} value={value.place} onPick={(place) => onChange({ ...value, place })} />
      </div>
    </fieldset>
  );
}

function Ring({ total, max }: { total: number; max: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-40 w-40" role="img" aria-label={`${total} out of ${max} points`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-sand" />
        <circle
          cx="64" cy="64" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          className="stroke-saffron transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - total / max)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl font-semibold text-maroon">{total}</span>
        <span className="text-sm text-ink-soft">out of {max}</span>
      </div>
    </div>
  );
}

const who = (s: Summary, fallback: string) => s.name || fallback;

export function MatchingTool({ whatsappHref }: { whatsappHref: string | null }) {
  const [groom, setGroom] = useState<PersonInput>(EMPTY);
  const [bride, setBride] = useState<PersonInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const complete = (p: PersonInput) => Boolean(p.date && p.time && p.place);
  const ready = complete(groom) && complete(bride) && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!groom.place || !bride.place) return setError("Please choose both birth places from the suggestions.");
    setBusy(true);
    setError(null);
    const pack = (p: PersonInput) => ({
      name: p.name,
      date: p.date,
      time: p.time,
      place: p.place!.label,
      latitude: p.place!.latitude,
      longitude: p.place!.longitude,
      timezone: p.place!.timezone,
    });
    try {
      const res = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groom: pack(groom), bride: pack(bride) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not calculate the match.");
      setResult(data as Result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const m = result?.match;
  const presentDoshas = m?.doshas.filter((d) => d.present) ?? [];

  return (
    <div>
      <form onSubmit={submit} noValidate>
        <div className="grid gap-6 lg:grid-cols-2">
          <PersonCard title="Groom" hint="Birth details of the boy" value={groom} onChange={setGroom} today={today} />
          <PersonCard title="Bride" hint="Birth details of the girl" value={bride} onChange={setBride} today={today} />
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={!ready}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Matching…</> : "Match kundlis"}
          </Button>
          <p className="text-sm text-ink-soft">Details are used only for this calculation and are not saved.</p>
        </div>
      </form>

      <div ref={resultRef} aria-live="polite" className="scroll-mt-24">
        {result && m && (
          <div className="mt-12 space-y-10">
            <div className="ornate-frame rounded-3xl p-6 text-center sm:p-10">
              <p className="eyebrow">Guna Milan result</p>
              <h2 className="mt-2 text-2xl text-maroon sm:text-3xl">
                {who(result.groom, "Groom")} <span className="text-saffron">&amp;</span> {who(result.bride, "Bride")}
              </h2>
              <div className="mt-6"><Ring total={m.total} max={m.max} /></div>
              <p
                className={`mx-auto mt-5 inline-block rounded-full px-5 py-1.5 font-semibold ${
                  m.level === "low" ? "bg-red-50 text-danger" : m.level === "acceptable" ? "bg-parchment text-maroon" : "bg-maroon text-ivory"
                }`}
              >
                {m.verdict}
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft">
                {m.percent}% compatibility on the traditional 36-point scale. Most families look for at least 18 points, and 25 or more is considered good.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { s: result.groom, label: "Groom" },
                { s: result.bride, label: "Bride" },
              ].map(({ s, label }) => (
                <div key={label} className="ornate-frame rounded-2xl p-5">
                  <p className="eyebrow">{s.name || label}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-ink-soft">Moon sign</dt>
                    <dd className="font-semibold text-maroon">{s.summary.moonSign} ({s.summary.moonSignEnglish})</dd>
                    <dt className="text-ink-soft">Nakshatra</dt>
                    <dd className="font-semibold text-maroon">{s.summary.nakshatra}, pada {s.summary.pada}</dd>
                    <dt className="text-ink-soft">Lagna</dt>
                    <dd className="font-semibold text-maroon">{s.summary.lagna}</dd>
                  </dl>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-4 text-2xl text-maroon">Score by koota</h3>
              <ul className="space-y-3">
                {m.kootas.map((k) => (
                  <li key={k.key} className="rounded-2xl border border-sand bg-white-warm p-4 sm:p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-serif text-xl text-maroon">{k.name}</p>
                      <p className="shrink-0 font-semibold text-charcoal">{k.score} <span className="font-normal text-ink-soft">/ {k.max}</span></p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                      <div className="h-full rounded-full bg-gradient-to-r from-saffron to-maroon" style={{ width: `${(k.score / k.max) * 100}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">{k.about}</p>
                    <p className="mt-1 text-sm">
                      <span className="text-ink-soft">{k.groom} (groom) · {k.bride} (bride).</span> {k.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-sand bg-white-warm p-5">
                <h3 className="text-xl text-maroon">Doshas in the match</h3>
                {presentDoshas.length === 0 ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden="true" />
                    No Nadi, Bhakoot or Gana dosha was found.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {presentDoshas.map((d) => (
                      <li key={d.name} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-saffron-deep" aria-hidden="true" />
                        <span>
                          <strong className="text-charcoal">{d.name}</strong>
                          {d.cancelled && <span className="ml-1.5 rounded-full bg-parchment px-2 py-0.5 text-xs text-maroon">traditionally cancelled</span>}
                          <span className="block text-ink-soft">{d.text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-sand bg-white-warm p-5">
                <h3 className="text-xl text-maroon">Manglik check</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {[
                    { s: result.groom, label: "Groom" },
                    { s: result.bride, label: "Bride" },
                  ].map(({ s, label }) => (
                    <li key={label} className="flex justify-between gap-3">
                      <span className="text-ink-soft">{s.name || label}</span>
                      <span className="font-semibold text-charcoal">
                        {s.manglik.is ? `Manglik (Mars in house ${s.manglik.house})` : `Not Manglik (Mars in house ${s.manglik.house})`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-soft">
                  {result.groom.manglik.is === result.bride.manglik.is
                    ? result.groom.manglik.is
                      ? "Both are Manglik, which traditionally balances the dosha."
                      : "Neither chart shows Mangal dosha."
                    : "Only one partner is Manglik. A consultation can check strength and remedies."}
                </p>
              </div>
            </div>

            <div className="ornate-frame rounded-3xl bg-parchment p-8 text-center sm:p-10">
              <h3 className="text-2xl text-maroon sm:text-3xl">Want this match read by Neelabh?</h3>
              <p className="mx-auto mt-3 max-w-xl text-ink-soft">A score is only the start. A consultation looks at both full charts, the dashas and the strength of each dosha before saying anything about the marriage.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/book" size="lg">Book a consultation</ButtonLink>
                <ButtonLink href="/services" variant="secondary" size="lg">View consultations</ButtonLink>
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="spring inline-flex min-h-12 items-center justify-center rounded-full border border-gold bg-white-warm px-7 font-semibold text-maroon">
                    WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-ink-soft">
              Indicative score using the classical Ashtakoota method (Lahiri ayanamsa, Moon positions from the open-source astronomy-engine library). Published tables differ slightly between almanacs, and a marriage decision should never rest on a score alone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
