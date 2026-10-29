import { NAKSHATRAS, PLANET_NAMES, RASHIS, type PlanetId } from "./constants";

/**
 * Ashtakoota ("Guna Milan") – the traditional 36-point match between two Moon positions.
 *
 * Pure functions only: give it the sidereal Moon longitude of the groom and the bride and it returns
 * the eight scores. Tables follow the commonly published classical sets (Muhurta Chintamani / BPHS
 * tradition). Almanacs differ by a point or so in a few cells (mostly Vashya and Gana), so the page
 * tells visitors the score is indicative.
 */

const NAK_SPAN = 360 / 27;

export type Koota = {
  key: "varna" | "vashya" | "tara" | "yoni" | "maitri" | "gana" | "bhakoot" | "nadi";
  name: string;
  max: number;
  score: number;
  groom: string;
  bride: string;
  /** What this koota looks at, in plain words. */
  about: string;
  /** Short note on the result for this couple. */
  note: string;
};

export type MatchResult = {
  kootas: Koota[];
  total: number;
  max: 36;
  percent: number;
  level: "excellent" | "good" | "acceptable" | "low";
  verdict: string;
  /** Traditional dosha flags with a plain-English explanation. */
  doshas: Array<{ name: string; present: boolean; cancelled: boolean; text: string }>;
};

export interface Person {
  moonLon: number; // sidereal, 0–360
}

const rashiOf = (lon: number) => Math.floor(lon / 30) + 1;
const nakOf = (lon: number) => Math.min(26, Math.floor(lon / NAK_SPAN));
const degInSign = (lon: number) => lon - (rashiOf(lon) - 1) * 30;

/* ------------------------------------------------------------------ tables */

// 1. Varna: rank by sign (Brahmin 4 > Kshatriya 3 > Vaishya 2 > Shudra 1).
const VARNA_NAME = ["", "Shudra", "Vaishya", "Kshatriya", "Brahmin"] as const;
// Sign order Mesha…Meena: Kshatriya 3, Vrishabha V2, Mithuna S1, Karka B4, Simha K3, Kanya V2, Tula S1, Vrischika B4, Dhanu K3, Makara V2, Kumbha S1, Meena B4
const VARNA_RANK: number[] = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4];

// 2. Vashya groups.
type Vashya = "Chatushpada" | "Manava" | "Jalachara" | "Vanachara" | "Keeta";
const VASHYA_ORDER: Vashya[] = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"];
function vashyaOf(lon: number): Vashya {
  const r = rashiOf(lon);
  const d = degInSign(lon);
  switch (r) {
    case 1: case 2: return "Chatushpada";
    case 3: case 6: case 7: case 11: return "Manava";
    case 4: case 12: return "Jalachara";
    case 5: return "Vanachara";
    case 8: return "Keeta";
    case 9: return d < 15 ? "Manava" : "Chatushpada";
    default: return d < 15 ? "Chatushpada" : "Jalachara"; // 10 Makara
  }
}
// Rows: bride group, columns: groom group, in VASHYA_ORDER.
const VASHYA_SCORE: number[][] = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0, 0, 0, 2, 0],
  [1, 1, 1, 0, 2],
];

// 4. Yoni.
const YONI_ORDER = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"] as const;
type Yoni = (typeof YONI_ORDER)[number];
const YONI_OF_NAK: Yoni[] = [
  "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog", "Cat", "Sheep", "Cat",
  "Rat", "Rat", "Cow", "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse", "Lion", "Cow", "Elephant",
];
export const YONI_SCORE: number[][] = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

// 5. Graha Maitri: natural friendships of the seven classical planets.
type Rel = "F" | "N" | "E";
const SEVEN: PlanetId[] = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];
const FRIEND: Record<string, Rel[]> = {
  //        Su   Mo   Ma   Me   Ju   Ve   Sa
  Su: ["N", "F", "F", "N", "F", "E", "E"],
  Mo: ["F", "N", "N", "F", "N", "N", "N"],
  Ma: ["F", "F", "N", "E", "F", "N", "N"],
  Me: ["F", "E", "N", "N", "N", "F", "N"],
  Ju: ["F", "F", "F", "E", "N", "E", "N"],
  Ve: ["E", "E", "N", "F", "N", "N", "F"],
  Sa: ["E", "E", "E", "F", "N", "F", "N"],
};
const relOf = (a: PlanetId, b: PlanetId): Rel => (a === b ? "F" : FRIEND[a][SEVEN.indexOf(b)]);
function maitriScore(a: Rel, b: Rel): number {
  const key = [a, b].sort().join("");
  switch (key) {
    case "FF": return 5;
    case "FN": return 4;
    case "NN": return 3;
    case "EF": return 1;
    case "EN": return 0.5;
    default: return 0; // EE
  }
}

// 6. Gana.
type Gana = "Deva" | "Manushya" | "Rakshasa";
const GANA_OF_NAK: Gana[] = [
  "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa",
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva",
];
const GANA_SCORE: Record<Gana, Record<Gana, number>> = {
  // [groom][bride]
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 0 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 1 },
  Rakshasa: { Deva: 0, Manushya: 0, Rakshasa: 6 },
};

// 8. Nadi.
type Nadi = "Aadi" | "Madhya" | "Antya";
const NADI_OF_NAK: Nadi[] = [
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya",
  "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya",
];

/* ------------------------------------------------------------------ scoring */

const lordOf = (rashi: number) => RASHIS[rashi - 1].lord;
const nakName = (lon: number) => NAKSHATRAS[nakOf(lon)];
const rashiName = (lon: number) => RASHIS[rashiOf(lon) - 1].sanskrit;

export function ashtakoota(groom: Person, bride: Person): MatchResult {
  const gR = rashiOf(groom.moonLon);
  const bR = rashiOf(bride.moonLon);
  const gN = nakOf(groom.moonLon);
  const bN = nakOf(bride.moonLon);
  const gPada = Math.floor((groom.moonLon % NAK_SPAN) / (NAK_SPAN / 4)) + 1;
  const bPada = Math.floor((bride.moonLon % NAK_SPAN) / (NAK_SPAN / 4)) + 1;

  // Varna
  const gV = VARNA_RANK[gR - 1];
  const bV = VARNA_RANK[bR - 1];
  const varna = gV >= bV ? 1 : 0;

  // Vashya
  const gVa = vashyaOf(groom.moonLon);
  const bVa = vashyaOf(bride.moonLon);
  const vashya = VASHYA_SCORE[VASHYA_ORDER.indexOf(bVa)][VASHYA_ORDER.indexOf(gVa)];

  // Tara: count both ways, remainders 3, 5 and 7 are unfavourable.
  const bad = (count: number) => [3, 5, 7].includes(count % 9);
  const fromBride = ((gN - bN + 27) % 27) + 1;
  const fromGroom = ((bN - gN + 27) % 27) + 1;
  const tara = (bad(fromBride) ? 0 : 1.5) + (bad(fromGroom) ? 0 : 1.5);

  // Yoni
  const gY = YONI_OF_NAK[gN];
  const bY = YONI_OF_NAK[bN];
  const yoni = YONI_SCORE[YONI_ORDER.indexOf(bY)][YONI_ORDER.indexOf(gY)];

  // Graha Maitri
  const gL = lordOf(gR);
  const bL = lordOf(bR);
  const maitri = gL === bL ? 5 : maitriScore(relOf(gL, bL), relOf(bL, gL));

  // Gana
  const gG = GANA_OF_NAK[gN];
  const bG = GANA_OF_NAK[bN];
  const gana = GANA_SCORE[gG][bG];

  // Bhakoot: sign distances 2/12, 5/9 and 6/8 score 0.
  const dist = ((bR - gR + 12) % 12) + 1;
  const bhakootBad = [2, 12, 5, 9, 6, 8].includes(dist);
  const bhakoot = bhakootBad ? 0 : 7;

  // Nadi
  const gD = NADI_OF_NAK[gN];
  const bD = NADI_OF_NAK[bN];
  const nadi = gD === bD ? 0 : 8;

  const bhakootCancelled =
    bhakootBad && (gL === bL || (relOf(gL, bL) === "F" && relOf(bL, gL) === "F"));
  const nadiCancelled =
    nadi === 0 && ((gR === bR && gN !== bN) || (gN === bN && gPada !== bPada) || (gN === bN && gR !== bR));

  const kootas: Koota[] = [
    {
      key: "varna", name: "Varna", max: 1, score: varna, groom: VARNA_NAME[gV], bride: VARNA_NAME[bV],
      about: "Spiritual outlook and ego compatibility.",
      note: varna ? "The groom's Varna is equal to or higher than the bride's, the traditional favourable order." : "The bride's Varna is higher than the groom's, so this point is not given.",
    },
    {
      key: "vashya", name: "Vashya", max: 2, score: vashya, groom: gVa, bride: bVa,
      about: "Mutual attraction and how well each partner can influence the other.",
      note: vashya === 2 ? "Same Vashya group: natural understanding." : vashya === 0 ? "Groups that pull apart; effort is needed to find common ground." : "Partly compatible groups.",
    },
    {
      key: "tara", name: "Tara", max: 3, score: tara, groom: `${nakName(groom.moonLon)}`, bride: `${nakName(bride.moonLon)}`,
      about: "Health and well-being of the couple, from the birth stars.",
      note: tara === 3 ? "Both directions are favourable." : tara === 0 ? "Both directions are unfavourable." : "One direction is favourable.",
    },
    {
      key: "yoni", name: "Yoni", max: 4, score: yoni, groom: gY, bride: bY,
      about: "Physical and intimate compatibility.",
      note: yoni === 4 ? "Same Yoni: a very close natural match." : yoni === 0 ? "Natural enemy Yonis: this needs care and understanding." : yoni >= 3 ? "Friendly Yonis." : "Neutral Yonis.",
    },
    {
      key: "maitri", name: "Graha Maitri", max: 5, score: maitri, groom: PLANET_NAMES[gL], bride: PLANET_NAMES[bL],
      about: "Mental compatibility and friendship, from the lords of the two Moon signs.",
      note: maitri >= 4 ? "The two sign lords are friends: a strong mental bond." : maitri >= 3 ? "Neutral sign lords." : "Sign lords that do not get along; communication needs patience.",
    },
    {
      key: "gana", name: "Gana", max: 6, score: gana, groom: gG, bride: bG,
      about: "Temperament: Deva (gentle), Manushya (balanced), Rakshasa (strong-willed).",
      note: gana === 6 ? "Same temperament." : gana === 0 ? "Very different temperaments; adjustment is needed." : "Different but workable temperaments.",
    },
    {
      key: "bhakoot", name: "Bhakoot", max: 7, score: bhakoot, groom: rashiName(groom.moonLon), bride: rashiName(bride.moonLon),
      about: "Emotional bond, family welfare and prosperity.",
      note: bhakootBad ? `Moon signs are in a ${dist === 2 || dist === 12 ? "2/12" : dist === 5 || dist === 9 ? "5/9" : "6/8"} position (Bhakoot dosha).${bhakootCancelled ? " The sign lords are the same or friends, which traditionally cancels it." : ""}` : "Moon signs are in a favourable position to each other.",
    },
    {
      key: "nadi", name: "Nadi", max: 8, score: nadi, groom: gD, bride: bD,
      about: "Health, genes and the energy balance of the couple. It carries the highest weight.",
      note: nadi === 0 ? `Same Nadi (Nadi dosha).${nadiCancelled ? " The Moon signs or stars differ in a way that traditionally cancels it." : ""}` : "Different Nadis: the favourable result.",
    },
  ];

  const total = kootas.reduce((s, k) => s + k.score, 0);
  const level = total >= 33 ? "excellent" : total >= 25 ? "good" : total >= 18 ? "acceptable" : "low";
  const verdict = {
    excellent: "Excellent match",
    good: "Good match",
    acceptable: "Acceptable match",
    low: "Below the traditional minimum of 18",
  }[level];

  return {
    kootas,
    total,
    max: 36,
    percent: Math.round((total / 36) * 100),
    level,
    verdict,
    doshas: [
      {
        name: "Nadi dosha",
        present: nadi === 0,
        cancelled: nadiCancelled,
        text: "Both partners share the same Nadi. It is the most discussed dosha and is worth a closer look in a consultation.",
      },
      {
        name: "Bhakoot dosha",
        present: bhakootBad,
        cancelled: bhakootCancelled,
        text: "The Moon signs sit in a 2/12, 5/9 or 6/8 position. Traditionally linked with emotional and family-level friction.",
      },
      {
        name: "Gana dosha",
        present: gana === 0,
        cancelled: false,
        text: "Temperaments (Gana) are far apart.",
      },
    ],
  };
}
