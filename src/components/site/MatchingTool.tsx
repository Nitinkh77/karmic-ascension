"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Heart, Loader2, MapPin, MessageCircle, RotateCcw, UserRound } from "lucide-react";
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
  role,
  title,
  hint,
  value,
  onChange,
  today,
}: {
  role: "groom" | "bride";
  title: string;
  hint: string;
  value: PersonInput;
  onChange: (v: PersonInput) => void;
  today: string;
}) {
  const uid = useId();
  const band = role === "groom" ? "from-maroon to-[#8c2a3c]" : "from-saffron-deep to-saffron";
  return (
    <fieldset className="min-w-0 overflow-hidden rounded-2xl border border-gold-soft bg-white-warm shadow-lift">
      <legend className="sr-only">{title}</legend>
      <div className={`flex items-center gap-3 bg-gradient-to-r ${band} px-5 py-4 text-ivory sm:px-6`} aria-hidden="true">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
          <UserRound className="h-6 w-6" />
        </span>
        <span>
          <span className="block font-serif text-2xl leading-none">{title}</span>
          <span className="mt-1 block text-xs text-ivory/80">{hint}</span>
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:p-6">
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
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(total);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      setShown(total * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);
  const label = Number.isInteger(total) ? Math.round(shown) : Math.round(shown * 2) / 2;
  return (
    <div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56" role="img" aria-label={`${total} out of ${max} points`}>
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-parchment to-white-warm shadow-inner" aria-hidden="true" />
      <svg viewBox="0 0 128 128" className="relative h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-saffron)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-maroon)" }} />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="9" className="stroke-sand" />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="9" strokeLinecap="round" stroke="url(#ringGrad)" strokeDasharray={c} strokeDashoffset={c * (1 - shown / max)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-5xl font-semibold text-maroon sm:text-6xl">{label}</span>
        <span className="text-sm text-ink-soft">out of {max}</span>
      </div>
    </div>
  );
}

/** Traffic-light tone for a koota score. */
function tone(score: number, max: number) {
  const k = score / max;
  if (k >= 0.75) return { bar: "bg-emerald-600", pill: "bg-emerald-50 text-emerald-800", word: "Strong" };
  if (k > 0) return { bar: "bg-amber-500", pill: "bg-amber-50 text-amber-800", word: "Partial" };
  return { bar: "bg-red-600", pill: "bg-red-50 text-danger", word: "Low" };
}

function conclusion(r: Result) {
  const { match: m } = r;
  const g = r.groom.name || "The groom";
  const b = r.bride.name || "the bride";
  const lead = {
    excellent: `${g} and ${b} score ${m.total} out of 36, an excellent match. Almost every area of compatibility is strong.`,
    good: `${g} and ${b} score ${m.total} out of 36, a good match. Most areas of compatibility are supportive.`,
    acceptable: `${g} and ${b} score ${m.total} out of 36, which is within the acceptable range. A few areas need understanding from both sides.`,
    low: `${g} and ${b} score ${m.total} out of 36, below the traditional minimum of 18. That does not rule the match out, but it deserves a detailed reading before any decision.`,
  }[m.level];
  const weak = m.kootas.filter((k) => k.score === 0).map((k) => k.name);
  return weak.length ? `${lead} Areas that scored zero: ${weak.join(", ")}.` : lead;
}

const who = (s: Summary, fallback: string) => s.name || fallback;

export function MatchingTool({ whatsappHref }: { whatsappHref: string | null }) {
  const [groom, setGroom] = useState<PersonInput>(EMPTY);
  const [bride, setBride] = useState<PersonInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  function shareOnWhatsApp(r: Result) {
    const text = `${who(r.groom, "Groom")} & ${who(r.bride, "Bride")}: ${r.match.total}/36 Guna Milan (${r.match.verdict}). Check your own match free: ${window.location.origin}/kundli-matching`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  const m = result?.match;
  const presentDoshas = m?.doshas.filter((d) => d.present) ?? [];

  return (
    <div>
      <form ref={formRef} onSubmit={submit} noValidate>
        <div className="relative grid gap-6 lg:grid-cols-2 lg:gap-10">
          <PersonCard role="groom" title="Groom" hint="Birth details of the boy" value={groom} onChange={setGroom} today={today} />
          <PersonCard role="bride" title="Bride" hint="Birth details of the girl" value={bride} onChange={setBride} today={today} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-ivory bg-gradient-to-br from-saffron to-maroon text-ivory shadow-lift lg:grid"
          >
            <Heart className="h-6 w-6 fill-current" />
          </span>
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg border border-danger/40 bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Button type="submit" size="lg" disabled={!ready} className="min-w-64">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Matching…</> : <>Match kundlis <Heart className="h-4 w-4" aria-hidden="true" /></>}
          </Button>
          <p className="text-sm text-ink-soft">Free. Details are used only for this calculation and are not saved.</p>
        </div>
      </form>

      <div ref={resultRef} aria-live="polite" className="scroll-mt-24">
        {result && m && (
          <div className="mt-14 space-y-10">
            {/* Score summary */}
            <div className="ornate-frame overflow-hidden rounded-3xl bg-white-warm">
              <div className="bg-gradient-to-r from-maroon to-[#8c2a3c] px-6 py-5 text-center text-ivory">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ivory/75">Guna Milan result</p>
                <h2 className="mt-1 font-serif text-2xl sm:text-3xl">
                  {who(result.groom, "Groom")} <span className="text-gold-soft">&amp;</span> {who(result.bride, "Bride")}
                </h2>
              </div>
              <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
                <Ring total={m.total} max={m.max} />
                <div className="text-center md:text-left">
                  <p
                    className={`inline-block rounded-full px-5 py-1.5 font-semibold ${
                      m.level === "low" ? "bg-red-50 text-danger" : m.level === "acceptable" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {m.verdict} · {m.percent}%
                  </p>
                  <p className="mt-4 text-lg text-charcoal">{conclusion(result)}</p>
                  <p className="mt-2 text-sm text-ink-soft">Most families look for at least 18 points, and 25 or more is considered good.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                    <button
                      type="button"
                      onClick={() => shareOnWhatsApp(result)}
                      className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-gold bg-white-warm px-5 text-sm font-semibold text-maroon hover:bg-parchment"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" /> Share result
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-sand bg-white-warm px-5 text-sm font-semibold text-charcoal hover:bg-parchment"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" /> Match another
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profiles */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { s: result.groom, label: "Groom", tint: "from-maroon to-[#8c2a3c]" },
                { s: result.bride, label: "Bride", tint: "from-saffron-deep to-saffron" },
              ].map(({ s, label, tint }) => (
                <div key={label} className="flex items-start gap-4 rounded-2xl border border-sand bg-white-warm p-5">
                  <span aria-hidden="true" className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${tint} font-serif text-xl text-ivory`}>
                    {(s.name || label)[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-maroon">{s.name || label} <span className="text-xs font-sans font-normal text-ink-soft">({label.toLowerCase()})</span></p>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="text-ink-soft">Moon sign</dt>
                      <dd className="font-semibold text-charcoal">{s.summary.moonSign} ({s.summary.moonSignEnglish})</dd>
                      <dt className="text-ink-soft">Nakshatra</dt>
                      <dd className="font-semibold text-charcoal">{s.summary.nakshatra}, pada {s.summary.pada}</dd>
                      <dt className="text-ink-soft">Lagna</dt>
                      <dd className="font-semibold text-charcoal">{s.summary.lagna}</dd>
                    </dl>
                  </div>
                </div>
              ))}
            </div>

            {/* Score table (desktop) */}
            <div>
              <h3 className="mb-4 text-2xl text-maroon sm:text-3xl">Ashtakoota score</h3>
              <div className="hidden overflow-hidden rounded-2xl border border-sand bg-white-warm md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Guna Milan score by koota</caption>
                  <thead className="bg-parchment text-xs uppercase tracking-wider text-maroon">
                    <tr>
                      <th scope="col" className="px-5 py-3">Koota</th>
                      <th scope="col" className="px-3 py-3">Groom</th>
                      <th scope="col" className="px-3 py-3">Bride</th>
                      <th scope="col" className="px-3 py-3 text-right">Out of</th>
                      <th scope="col" className="w-44 px-5 py-3">Score</th>
                    </tr>
                  </thead>
                  {m.kootas.map((k) => {
                    const t = tone(k.score, k.max);
                    return (
                      <tbody key={k.key} className="border-t border-sand">
                        <tr>
                          <th scope="row" className="px-5 pb-1 pt-4 align-top">
                            <span className="block font-serif text-lg text-maroon">{k.name}</span>
                            <span className="block text-xs font-normal text-ink-soft">{k.about}</span>
                          </th>
                          <td className="px-3 pt-4 align-top text-charcoal">{k.groom}</td>
                          <td className="px-3 pt-4 align-top text-charcoal">{k.bride}</td>
                          <td className="px-3 pt-4 text-right align-top text-ink-soft">{k.max}</td>
                          <td className="px-5 pt-4 align-top">
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.pill}`}>{k.score}</span>
                              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                                <span className={`block h-full rounded-full ${t.bar}`} style={{ width: `${(k.score / k.max) * 100}%` }} />
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-5 pb-4 pt-1 text-xs text-ink-soft">{k.note}</td>
                        </tr>
                      </tbody>
                    );
                  })}
                  <tfoot>
                    <tr className="border-t-2 border-gold-soft bg-parchment">
                      <th scope="row" colSpan={3} className="px-5 py-4 font-serif text-xl text-maroon">Total</th>
                      <td className="px-3 py-4 text-right font-semibold text-charcoal">{m.max}</td>
                      <td className="px-5 py-4 font-serif text-2xl font-semibold text-maroon">{m.total}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Cards (mobile) */}
              <ul className="space-y-3 md:hidden">
                {m.kootas.map((k) => {
                  const t = tone(k.score, k.max);
                  return (
                    <li key={k.key} className="rounded-2xl border border-sand bg-white-warm p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-serif text-xl text-maroon">{k.name}</p>
                        <p className={`shrink-0 rounded-full px-3 py-0.5 text-sm font-semibold ${t.pill}`}>{k.score} / {k.max}</p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand" aria-hidden="true">
                        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${(k.score / k.max) * 100}%` }} />
                      </div>
                      <p className="mt-3 text-xs text-ink-soft">{k.about}</p>
                      <p className="mt-1 text-sm"><span className="text-ink-soft">{k.groom} (groom) · {k.bride} (bride).</span> {k.note}</p>
                    </li>
                  );
                })}
                <li className="flex items-center justify-between rounded-2xl bg-parchment p-4">
                  <span className="font-serif text-xl text-maroon">Total</span>
                  <span className="font-serif text-2xl font-semibold text-maroon">{m.total} <span className="text-base font-normal text-ink-soft">/ {m.max}</span></span>
                </li>
              </ul>
            </div>

            {/* Doshas and Manglik */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-sand bg-white-warm p-5 sm:p-6">
                <h3 className="text-xl text-maroon sm:text-2xl">Doshas in the match</h3>
                {presentDoshas.length === 0 ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    No Nadi, Bhakoot or Gana dosha was found.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {presentDoshas.map((d) => (
                      <li key={d.name} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-saffron-deep" aria-hidden="true" />
                        <span>
                          <strong className="text-charcoal">{d.name}</strong>
                          {d.cancelled && <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">traditionally cancelled</span>}
                          <span className="block text-ink-soft">{d.text}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-sand bg-white-warm p-5 sm:p-6">
                <h3 className="text-xl text-maroon sm:text-2xl">Manglik check</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    { s: result.groom, label: "Groom" },
                    { s: result.bride, label: "Bride" },
                  ].map(({ s, label }) => (
                    <li key={label} className="flex items-center justify-between gap-3">
                      <span className="text-ink-soft">{s.name || label}</span>
                      <span className={`rounded-full px-3 py-0.5 font-semibold ${s.manglik.is ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
                        {s.manglik.is ? "Manglik" : "Not Manglik"} · Mars in house {s.manglik.house}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-soft">
                  {result.groom.manglik.is === result.bride.manglik.is
                    ? result.groom.manglik.is
                      ? "Both are Manglik, which traditionally balances the dosha."
                      : "Neither chart shows Mangal dosha."
                    : "Only one partner is Manglik. A consultation can check its strength and remedies."}
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
