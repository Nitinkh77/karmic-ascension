"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { NorthIndianChart } from "@/components/site/NorthIndianChart";
import { Button, ButtonLink } from "@/components/ui";
import { RASHIS } from "@/lib/astro/constants";
import type { Chart, DashaPeriod } from "@/lib/astro/chart";

interface Place {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
interface Result {
  name: string | null;
  place: string;
  timezone: string;
  utcOffsetMinutes: number;
  local: { date: string; time: string };
  chart: Chart;
  dasha: DashaPeriod[];
}

const dm = (deg: number) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
};
const my = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const offsetLabel = (min: number) => `UTC${min >= 0 ? "+" : "−"}${Math.floor(Math.abs(min) / 60)}:${String(Math.abs(min) % 60).padStart(2, "0")}`;

export function KundaliTool({ whatsappHref }: { whatsappHref: string | null }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [options, setOptions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Debounced place search (selecting a suggestion fixes coordinates and time zone).
  useEffect(() => {
    if (place || query.trim().length < 2) {
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
        /* aborted or offline: keep whatever is shown */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, place]);

  const today = new Date().toISOString().slice(0, 10);
  const ready = Boolean(date && time && place) && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) return setError("Please choose your birth place from the suggestions.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, time, place: place.label, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not calculate the chart.");
      setResult(data as Result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const c = result?.chart;
  const planet = (id: string) => c?.planets.find((p) => p.id === id);
  const now = Date.now();
  const currentMd = result?.dasha.find((d) => Date.parse(d.start) <= now && now < Date.parse(d.end));
  const currentAd = currentMd?.antardashas?.find((a) => Date.parse(a.start) <= now && now < Date.parse(a.end));

  return (
    <div>
      <form onSubmit={submit} noValidate className="ornate-frame rounded-2xl p-6 sm:p-8" aria-describedby={`${uid}-privacy`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-semibold">Name <span className="font-normal text-ink-soft">(optional)</span></label>
            <input id={`${uid}-name`} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          </div>
          <div>
            <label htmlFor={`${uid}-date`} className="mb-1.5 block text-sm font-semibold">Date of birth</label>
            <input id={`${uid}-date`} type="date" required className="field" value={date} max={today} min="1800-01-01" onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`${uid}-time`} className="mb-1.5 block text-sm font-semibold">Time of birth (local)</label>
            <input id={`${uid}-time`} type="time" required className="field" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="relative sm:col-span-2">
            <label htmlFor={`${uid}-place`} className="mb-1.5 block text-sm font-semibold">Place of birth</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
              <input
                id={`${uid}-place`}
                role="combobox"
                aria-expanded={open && options.length > 0}
                aria-controls={`${uid}-list`}
                aria-autocomplete="list"
                autoComplete="off"
                required
                placeholder="Start typing a city, e.g. Prayagraj"
                className="field !pl-9"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPlace(null);
                }}
                onFocus={() => options.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
              />
            </div>
            {open && options.length > 0 && (
              <ul id={`${uid}-list`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-sand bg-white-warm py-1 shadow-lift">
                {options.map((o) => (
                  <li key={`${o.label}-${o.latitude}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="block min-h-11 w-full px-4 py-2 text-left text-sm hover:bg-parchment"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setPlace(o);
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
            {place && <p className="mt-1.5 text-xs text-ink-soft">Time zone {place.timezone} · {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°</p>}
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={!ready}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Calculating…</> : "Create my kundali"}
          </Button>
          <p id={`${uid}-privacy`} className="text-sm text-ink-soft">Your details are used only for this calculation and are not saved.</p>
        </div>
      </form>

      <div ref={resultRef} aria-live="polite" className="scroll-mt-24">
        {result && c && (
          <div className="mt-12 space-y-10">
            <div className="text-center">
              <h2 className="text-3xl text-maroon sm:text-4xl">{result.name ? `${result.name}'s kundali` : "Your kundali"}</h2>
              <p className="mt-2 text-ink-soft">
                {new Date(`${result.local.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}, {result.local.time} · {result.place} · {offsetLabel(result.utcOffsetMinutes)}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["Lagna (Ascendant)", `${RASHIS[c.ascendant.rashi - 1].sanskrit} ${dm(c.ascendant.degree)}`, `${RASHIS[c.ascendant.rashi - 1].english} · ${c.ascendant.nakshatra} pada ${c.ascendant.pada}`],
                ["Moon sign (Rashi)", RASHIS[(planet("Mo")?.rashi ?? 1) - 1].sanskrit, `${RASHIS[(planet("Mo")?.rashi ?? 1) - 1].english}`],
                ["Janma Nakshatra", `${planet("Mo")?.nakshatra}`, `Pada ${planet("Mo")?.pada}`],
                ["Sun sign", RASHIS[(planet("Su")?.rashi ?? 1) - 1].sanskrit, `${RASHIS[(planet("Su")?.rashi ?? 1) - 1].english} · Tithi ${c.tithi.name} (${c.tithi.paksha})`],
              ].map(([label, value, sub]) => (
                <div key={label} className="ornate-frame rounded-2xl p-5">
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-2 font-serif text-2xl font-semibold text-maroon">{value}</dd>
                  <dd className="mt-1 text-sm text-ink-soft">{sub}</dd>
                </div>
              ))}
            </dl>

            <div className="grid items-start gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-2xl text-maroon">Birth chart (Rashi)</h3>
                <NorthIndianChart chart={c} className="mx-auto w-full max-w-md" />
                <p className="mt-3 text-center text-xs text-ink-soft">North Indian style · whole-sign houses · numbers are signs (1 Mesha … 12 Meena) · ᴿ = retrograde</p>
              </div>
              <div>
                <h3 className="mb-3 text-2xl text-maroon">Planet positions</h3>
                <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white-warm">
                  <li className="flex items-center justify-between gap-3 p-3.5 text-sm">
                    <span className="font-semibold text-charcoal">Lagna</span>
                    <span className="text-right text-ink-soft">{RASHIS[c.ascendant.rashi - 1].sanskrit} {dm(c.ascendant.degree)} · {c.ascendant.nakshatra}</span>
                  </li>
                  {c.planets.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                      <span className="font-semibold text-charcoal">
                        {p.name}
                        {p.retrograde && p.id !== "Ra" && p.id !== "Ke" && <span className="ml-1 text-xs font-normal text-saffron-deep">(retrograde)</span>}
                      </span>
                      <span className="text-right text-ink-soft">
                        {RASHIS[p.rashi - 1].sanskrit} {dm(p.degree)} · {p.nakshatra} {p.pada} · House {p.house}
                        {p.dignity && <span className="ml-1.5 rounded-full bg-parchment px-2 py-0.5 text-xs text-maroon">{p.dignity}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-2xl text-maroon">Vimshottari Dasha</h3>
              <p className="mb-4 text-sm text-ink-soft">
                Planetary periods counted from your Moon&apos;s nakshatra.
                {currentMd && <> You are in <strong className="text-charcoal">{currentMd.name}</strong> mahadasha{currentAd && <>, <strong className="text-charcoal">{currentAd.name}</strong> antardasha</>} (until {my(currentAd?.end ?? currentMd.end)}).</>}
              </p>
              <div className="space-y-2">
                {result.dasha.map((d) => {
                  const active = d === currentMd;
                  return (
                    <details key={d.start} open={active} className="rounded-xl border border-sand bg-white-warm">
                      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 font-semibold text-charcoal">
                        <span>{d.name}{active && <span className="ml-2 rounded-full bg-maroon px-2 py-0.5 text-xs font-medium text-ivory">now</span>}</span>
                        <span className="text-sm font-normal text-ink-soft">{my(d.start)} – {my(d.end)}</span>
                      </summary>
                      <ul className="grid gap-x-6 border-t border-sand px-4 py-3 text-sm sm:grid-cols-2">
                        {d.antardashas?.map((a) => (
                          <li key={a.start} className={`flex justify-between gap-3 py-1 ${a === currentAd ? "font-semibold text-maroon" : "text-ink-soft"}`}>
                            <span>{d.name}–{a.name}</span>
                            <span>{my(a.start)} – {my(a.end)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </div>

            <div className="ornate-frame rounded-3xl bg-parchment p-8 text-center sm:p-10">
              <h3 className="text-2xl text-maroon sm:text-3xl">Want this chart read for you?</h3>
              <p className="mx-auto mt-3 max-w-xl text-ink-soft">A calculated chart is only the map. A consultation explains what it means for your questions, with the exact birth time checked.</p>
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
              Calculated with the open-source <Link href="https://github.com/cosinekitty/astronomy" className="underline" target="_blank" rel="noopener noreferrer">astronomy-engine</Link> library using the Lahiri ayanamsa and the mean lunar node. Planet positions are accurate to a few arc-minutes; accuracy of the Lagna depends on the exact birth time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
