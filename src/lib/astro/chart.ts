import * as Astronomy from "astronomy-engine";
import {
  DASHA_ORDER,
  DASHA_YEARS,
  EXALTATION,
  NAKSHATRAS,
  OWN_SIGNS,
  PLANET_NAMES,
  RASHIS,
  TITHI_NAMES,
  type PlanetId,
} from "@/lib/astro/constants";

/**
 * Sidereal (Lahiri / Chitrapaksha) birth-chart maths.
 *
 * Positions come from the open-source astronomy-engine library (MIT, VSOP87 + a Moon theory).
 * Everything specific to Vedic astrology (ayanamsa, ascendant, whole-sign houses, nakshatras,
 * Vimshottari dasha) is implemented here and covered by tests against independent references.
 */

const DEG = Math.PI / 180;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;
const NAK_SPAN = 360 / 27;

/** General precession in ecliptic longitude since J2000, arc-seconds (IAU 2006 p_A). */
const precession = (T: number) => 5028.796195 * T + 1.1054348 * T * T;
const LAHIRI_T0_JD = 2435553.5; // 23 Sep 1956, the epoch the Indian Calendar Reform Committee fixed
const LAHIRI_AYANAMSA_T0 = 23.245524743; // degrees at that epoch (Swiss Ephemeris SE_SIDM_LAHIRI definition)

/** Mean Lahiri ayanamsa in degrees for a Julian Day (UT). */
export function lahiriAyanamsa(jdUt: number): number {
  const T = (jdUt - 2451545) / 36525;
  const T0 = (LAHIRI_T0_JD - 2451545) / 36525;
  return LAHIRI_AYANAMSA_T0 + (precession(T) - precession(T0)) / 3600;
}

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  /** Sidereal longitude, 0–360°. */
  lon: number;
  rashi: number; // 1..12
  degree: number; // degrees within the sign, 0–30
  nakshatra: string;
  pada: number; // 1..4
  house: number; // whole-sign house counted from the ascendant
  retrograde: boolean;
  dignity: "exalted" | "own" | "debilitated" | null;
}

export interface Chart {
  utc: string;
  latitude: number;
  longitude: number;
  ayanamsa: number;
  ascendant: { lon: number; rashi: number; degree: number; nakshatra: string; pada: number };
  planets: PlanetPosition[];
  /** For each house 1..12: the sign number (1..12) that occupies it. */
  houses: number[];
  tithi: { name: string; paksha: "Shukla" | "Krishna"; number: number };
}

type SkyBody = Astronomy.Body;
const SKY: Record<Exclude<PlanetId, "Ra" | "Ke">, SkyBody> = {
  Su: Astronomy.Body.Sun,
  Mo: Astronomy.Body.Moon,
  Ma: Astronomy.Body.Mars,
  Me: Astronomy.Body.Mercury,
  Ju: Astronomy.Body.Jupiter,
  Ve: Astronomy.Body.Venus,
  Sa: Astronomy.Body.Saturn,
};

/** Geocentric ecliptic longitude on the MEAN equinox of date (nutation removed), degrees. */
function meanTropicalLongitude(body: SkyBody, time: Astronomy.AstroTime): number {
  const vec = body === Astronomy.Body.Moon ? Astronomy.GeoMoon(time) : Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(vec);
  return norm360(ecl.elon - Astronomy.e_tilt(time).dpsi / 3600);
}

/** Mean lunar node (Rahu) on the mean equinox of date, degrees. */
function meanNode(jdTt: number): number {
  const T = (jdTt - 2451545) / 36525;
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
}

const rashiOf = (lon: number) => Math.floor(lon / 30) + 1;

export function nakshatraOf(lon: number) {
  const idx = Math.floor(lon / NAK_SPAN);
  const pada = Math.floor((lon % NAK_SPAN) / (NAK_SPAN / 4)) + 1;
  return { index: idx, name: NAKSHATRAS[idx] ?? NAKSHATRAS[0], pada };
}

/** Tropical (mean-equinox) ascendant for a place and instant, degrees. */
export function ascendantMean(time: Astronomy.AstroTime, latitude: number, longitude: number): number {
  const tilt = Astronomy.e_tilt(time);
  const ramc = norm360(Astronomy.SiderealTime(time) * 15 + longitude) * DEG;
  const eps = tilt.tobl * DEG;
  const phi = latitude * DEG;
  const y = Math.cos(ramc);
  const x = -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc));
  return norm360(Math.atan2(y, x) / DEG - tilt.dpsi / 3600);
}

function dignityOf(id: PlanetId, rashi: number): PlanetPosition["dignity"] {
  const ex = EXALTATION[id];
  if (ex === rashi) return "exalted";
  if (ex !== undefined && ((ex + 5) % 12) + 1 === rashi) return "debilitated";
  if (OWN_SIGNS[id]?.includes(rashi)) return "own";
  return null;
}

export function computeChart(utc: Date, latitude: number, longitude: number): Chart {
  const time = Astronomy.MakeTime(utc);
  const jdUt = time.ut + 2451545;
  const ayanamsa = lahiriAyanamsa(jdUt);
  const sid = (tropical: number) => norm360(tropical - ayanamsa);

  const ascLon = sid(ascendantMean(time, latitude, longitude));
  const ascRashi = rashiOf(ascLon);

  const dayBefore = Astronomy.MakeTime(new Date(utc.getTime() - 12 * 3600_000));
  const dayAfter = Astronomy.MakeTime(new Date(utc.getTime() + 12 * 3600_000));

  const raw: Array<{ id: PlanetId; lon: number; retro: boolean }> = [];
  for (const id of Object.keys(SKY) as Array<keyof typeof SKY>) {
    const body = SKY[id];
    const lon = sid(meanTropicalLongitude(body, time));
    let retro = false;
    if (id !== "Su" && id !== "Mo") {
      const a = meanTropicalLongitude(body, dayBefore);
      const b = meanTropicalLongitude(body, dayAfter);
      retro = ((b - a + 540) % 360) - 180 < 0;
    }
    raw.push({ id, lon, retro });
  }
  const rahu = sid(meanNode(time.tt + 2451545));
  raw.push({ id: "Ra", lon: rahu, retro: true });
  raw.push({ id: "Ke", lon: norm360(rahu + 180), retro: true });

  const planets: PlanetPosition[] = raw.map(({ id, lon, retro }) => {
    const rashi = rashiOf(lon);
    const nak = nakshatraOf(lon);
    return {
      id,
      name: PLANET_NAMES[id],
      lon,
      rashi,
      degree: lon - (rashi - 1) * 30,
      nakshatra: nak.name,
      pada: nak.pada,
      house: ((rashi - ascRashi + 12) % 12) + 1,
      retrograde: retro,
      dignity: dignityOf(id, rashi),
    };
  });

  const ascNak = nakshatraOf(ascLon);
  const sun = planets.find((p) => p.id === "Su")!;
  const moon = planets.find((p) => p.id === "Mo")!;
  const elong = norm360(moon.lon - sun.lon);
  const tithiNumber = Math.floor(elong / 12) + 1; // 1..30
  const inPaksha = ((tithiNumber - 1) % 15) + 1;
  const tithiName =
    tithiNumber === 15 ? "Purnima" : tithiNumber === 30 ? "Amavasya" : (TITHI_NAMES[inPaksha - 1] ?? "");

  return {
    utc: utc.toISOString(),
    latitude,
    longitude,
    ayanamsa,
    ascendant: { lon: ascLon, rashi: ascRashi, degree: ascLon - (ascRashi - 1) * 30, nakshatra: ascNak.name, pada: ascNak.pada },
    planets,
    houses: Array.from({ length: 12 }, (_, i) => ((ascRashi - 1 + i) % 12) + 1),
    tithi: { name: tithiName, paksha: tithiNumber <= 15 ? "Shukla" : "Krishna", number: tithiNumber },
  };
}

/* ------------------------------------------------------------------ Vimshottari dasha */

export interface DashaPeriod {
  lord: PlanetId;
  name: string;
  start: string; // ISO
  end: string; // ISO
  antardashas?: Array<{ lord: PlanetId; name: string; start: string; end: string }>;
}

const MS_PER_YEAR = 365.25 * 86400_000;

/** Vimshottari mahadasha / antardasha periods for the 120 years after birth, from the Moon's longitude. */
export function vimshottari(moonLon: number, birth: Date): DashaPeriod[] {
  const nak = Math.floor(moonLon / NAK_SPAN);
  const elapsed = (moonLon % NAK_SPAN) / NAK_SPAN; // fraction of the nakshatra already traversed
  const first = nak % 9;
  const out: DashaPeriod[] = [];
  let start = birth.getTime() - elapsed * DASHA_YEARS[DASHA_ORDER[first]] * MS_PER_YEAR;

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(first + i) % 9];
    const years = DASHA_YEARS[lord];
    const end = start + years * MS_PER_YEAR;
    const antar: NonNullable<DashaPeriod["antardashas"]> = [];
    let aStart = start;
    for (let j = 0; j < 9; j++) {
      const aLord = DASHA_ORDER[(DASHA_ORDER.indexOf(lord) + j) % 9];
      const aEnd = aStart + (years * DASHA_YEARS[aLord] * MS_PER_YEAR) / 120;
      antar.push({ lord: aLord, name: PLANET_NAMES[aLord], start: new Date(aStart).toISOString(), end: new Date(aEnd).toISOString() });
      aStart = aEnd;
    }
    out.push({ lord, name: PLANET_NAMES[lord], start: new Date(start).toISOString(), end: new Date(end).toISOString(), antardashas: antar });
    start = end;
  }
  return out;
}

export const rashiName = (n: number) => RASHIS[n - 1]?.sanskrit ?? "";
