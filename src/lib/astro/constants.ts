/** Static reference data for Vedic (sidereal) astrology. */

export type Element = "Fire" | "Earth" | "Air" | "Water";

export interface Rashi {
  n: number; // 1..12
  slug: string;
  sanskrit: string;
  english: string;
  symbol: string;
  lord: PlanetId;
  element: Element;
}

export const RASHIS: readonly Rashi[] = [
  { n: 1, slug: "mesha", sanskrit: "Mesha", english: "Aries", symbol: "♈", lord: "Ma", element: "Fire" },
  { n: 2, slug: "vrishabha", sanskrit: "Vrishabha", english: "Taurus", symbol: "♉", lord: "Ve", element: "Earth" },
  { n: 3, slug: "mithuna", sanskrit: "Mithuna", english: "Gemini", symbol: "♊", lord: "Me", element: "Air" },
  { n: 4, slug: "karka", sanskrit: "Karka", english: "Cancer", symbol: "♋", lord: "Mo", element: "Water" },
  { n: 5, slug: "simha", sanskrit: "Simha", english: "Leo", symbol: "♌", lord: "Su", element: "Fire" },
  { n: 6, slug: "kanya", sanskrit: "Kanya", english: "Virgo", symbol: "♍", lord: "Me", element: "Earth" },
  { n: 7, slug: "tula", sanskrit: "Tula", english: "Libra", symbol: "♎", lord: "Ve", element: "Air" },
  { n: 8, slug: "vrischika", sanskrit: "Vrischika", english: "Scorpio", symbol: "♏", lord: "Ma", element: "Water" },
  { n: 9, slug: "dhanu", sanskrit: "Dhanu", english: "Sagittarius", symbol: "♐", lord: "Ju", element: "Fire" },
  { n: 10, slug: "makara", sanskrit: "Makara", english: "Capricorn", symbol: "♑", lord: "Sa", element: "Earth" },
  { n: 11, slug: "kumbha", sanskrit: "Kumbha", english: "Aquarius", symbol: "♒", lord: "Sa", element: "Air" },
  { n: 12, slug: "meena", sanskrit: "Meena", english: "Pisces", symbol: "♓", lord: "Ju", element: "Water" },
];

export type PlanetId = "Su" | "Mo" | "Ma" | "Me" | "Ju" | "Ve" | "Sa" | "Ra" | "Ke";

export const PLANET_NAMES: Record<PlanetId, string> = {
  Su: "Sun",
  Mo: "Moon",
  Ma: "Mars",
  Me: "Mercury",
  Ju: "Jupiter",
  Ve: "Venus",
  Sa: "Saturn",
  Ra: "Rahu",
  Ke: "Ketu",
};

/** Nakshatra names with their Vimshottari ruling planet (the 9-planet order repeats three times). */
export const DASHA_ORDER: readonly PlanetId[] = ["Ke", "Ve", "Su", "Mo", "Ma", "Ra", "Ju", "Sa", "Me"];
export const DASHA_YEARS: Record<PlanetId, number> = { Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17 };

export const NAKSHATRAS: readonly string[] = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const TITHI_NAMES: readonly string[] = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

/** Sign numbers (1..12) in which a planet is exalted / in its own sign. Debilitation is the opposite sign of exaltation. */
export const EXALTATION: Partial<Record<PlanetId, number>> = { Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7 };
export const OWN_SIGNS: Partial<Record<PlanetId, number[]>> = {
  Su: [5], Mo: [4], Ma: [1, 8], Me: [3, 6], Ju: [9, 12], Ve: [2, 7], Sa: [10, 11],
};

export const rashiBySlug = (slug: string) => RASHIS.find((r) => r.slug === slug);
