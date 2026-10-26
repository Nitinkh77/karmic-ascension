import { computeChart } from "@/lib/astro/chart";
import { RASHIS, type Rashi } from "@/lib/astro/constants";

/**
 * Daily horoscope by Moon sign (Chandra Gochar, the classical Vedic method).
 *
 * The Moon's position for the day is calculated from the astronomy-engine library. For each Moon sign (rashi),
 * the house the transiting Moon occupies counted FROM that sign decides the day's tone. The wording below is
 * general guidance for reflection, not a prediction of events; a personal reading needs the full birth chart.
 */

export type Tone = "supportive" | "mixed" | "careful";

export interface HouseReading {
  tone: Tone;
  title: string;
  overview: string;
  work: string;
  relationships: string;
  wellbeing: string;
  tip: string;
}

/** Index 0 = Moon in the 1st house from your Moon sign, … index 11 = 12th. */
export const HOUSE_READINGS: readonly HouseReading[] = [
  {
    tone: "supportive",
    title: "Feelings run close to the surface",
    overview: "The Moon is on your own sign, so moods and instincts are easy to read today. Energy is generally steady and you feel more like yourself.",
    work: "Good day to start or tidy up personal tasks. Trust your first read of a situation, then check the details.",
    relationships: "People notice your mood. Say what you feel plainly and kindly, and listen for the same in return.",
    wellbeing: "Vitality tends to be good. Keep meals regular and avoid letting emotions drive snacking or late nights.",
    tip: "Begin the day with a few quiet minutes before checking your phone.",
  },
  {
    tone: "careful",
    title: "Mind your words and your spending",
    overview: "The Moon moves through the house of speech, family and resources. Conversations about money or family can carry extra weight today.",
    work: "Re-read what you write before you send it. Postpone large purchases or commitments if you feel pressed to decide quickly.",
    relationships: "Gentle, measured speech goes a long way at home. Avoid reopening old arguments.",
    wellbeing: "Eat simply and sit down to eat. Rushed or emotional eating is the common trap today.",
    tip: "Pause for one breath before answering anything that irritates you.",
  },
  {
    tone: "supportive",
    title: "Initiative and clear communication",
    overview: "The Moon in the house of effort and courage favours action. Small, steady steps taken today tend to count more than big plans.",
    work: "Good for calls, messages, short trips, learning and finishing pending tasks. Take the first step on something you have delayed.",
    relationships: "Siblings, neighbours and colleagues are easy to reach. A short, honest conversation clears more than silence.",
    wellbeing: "Movement helps. A walk or light exercise settles a restless mind.",
    tip: "Pick one task you have been avoiding and do the first ten minutes of it.",
  },
  {
    tone: "mixed",
    title: "Home, rest and inner comfort",
    overview: "The Moon is in the house of home and peace of mind. You may feel pulled inward, with a wish for comfort and familiar company.",
    work: "Concentration can wander. Keep to routine work and leave big decisions about property or relocation for another day.",
    relationships: "Time with family, and especially with your mother or elders, is nourishing. Avoid taking small remarks to heart.",
    wellbeing: "Rest matters more than usual. Early sleep and a calm evening restore you.",
    tip: "Make your space comfortable before you try to be productive in it.",
  },
  {
    tone: "mixed",
    title: "A busy mind, creative and restless",
    overview: "The Moon is in the house of intellect, creativity and children. Ideas come easily, but so do second thoughts.",
    work: "Good for study, planning and creative work. Avoid acting on a hunch alone; check it against facts.",
    relationships: "Affection and playfulness help. With children or students, patience works better than instruction.",
    wellbeing: "Mental tiredness is likelier than physical tiredness. Take screen breaks.",
    tip: "Write your thoughts down; the plan that survives rereading is the one to follow.",
  },
  {
    tone: "supportive",
    title: "Obstacles ease, routines pay off",
    overview: "The Moon in the house of effort against difficulties is a traditionally helpful position. Problems that looked heavy become manageable.",
    work: "Tackle backlogs, negotiations and anything that needs discipline. Competition or criticism is easier to handle than usual.",
    relationships: "Be fair and practical with colleagues. Offering help earns more goodwill today than winning a point.",
    wellbeing: "A good day to restart a healthy habit: regular meals, water, a short walk.",
    tip: "Clear one stubborn item from your list before noon.",
  },
  {
    tone: "supportive",
    title: "Partnerships and meetings go well",
    overview: "The Moon is in the house of partnership. Dealings with spouse, partners, clients and the public tend to run smoothly.",
    work: "Good for meetings, agreements and collaboration. Listen first; the good idea may come from the other person.",
    relationships: "A fine day to reconnect or to speak openly with someone close. Warmth is received well.",
    wellbeing: "Social time lifts the mood. Balance it with a little time alone.",
    tip: "Reach out to one person you have been meaning to contact.",
  },
  {
    tone: "careful",
    title: "Go slowly and keep things simple",
    overview: "The Moon is in the eighth house, a time for patience. Plans can change at short notice and feelings run deeper than they show.",
    work: "Avoid risky moves, impulsive signing or hurried decisions. Double-check documents and arrangements.",
    relationships: "Guard against suspicion or secrecy. If something troubles you, say it calmly rather than brooding.",
    wellbeing: "Drive and travel with extra care, and do not skip rest. Gentle routines steady the mind.",
    tip: "If you feel unsettled, postpone the decision, not the day.",
  },
  {
    tone: "mixed",
    title: "Faith, guidance and slower progress",
    overview: "The Moon is in the house of belief and long-term direction. Progress may feel slower, and the mind turns towards meaning and guidance.",
    work: "Keep to what is already in motion. Seek advice from someone you trust before committing to a new direction.",
    relationships: "Teachers, elders and mentors are helpful. Avoid debates about beliefs with people who are not asking.",
    wellbeing: "Prayer, quiet reading or time outdoors steadies you. Take care with long journeys.",
    tip: "Ask for one piece of advice today and act on it.",
  },
  {
    tone: "supportive",
    title: "Responsibility is noticed",
    overview: "The Moon is in the house of career and standing. Efforts at work tend to be visible, and you are able to carry responsibility well.",
    work: "A good day to lead, present and finish important work. Be punctual and thorough.",
    relationships: "Family understands when work takes priority, but one warm message keeps the balance.",
    wellbeing: "Take proper breaks so that effort does not become strain.",
    tip: "Do the most important task first, while your focus is fresh.",
  },
  {
    tone: "supportive",
    title: "Support from friends and networks",
    overview: "The Moon is in the house of gains and fulfilment. Friends, networks and earlier efforts can bring welcome news or help.",
    work: "Good for networking, follow-ups and asking for what you need. Pending matters tend to move.",
    relationships: "Social plans are enjoyable. Elder siblings and friends are especially supportive.",
    wellbeing: "Mood is generally light. Enjoy company without overdoing food or late nights.",
    tip: "Say thank you to someone who helped you earlier; it keeps the goodwill going.",
  },
  {
    tone: "careful",
    title: "Rest, reflection and watching expenses",
    overview: "The Moon is in the twelfth house, a quiet position. Energy is better spent on rest and reflection than on pushing ahead.",
    work: "Keep to routine tasks, watch small expenses and avoid starting anything major. Behind-the-scenes work goes well.",
    relationships: "You may want more solitude than usual. Tell people you are recharging so that it is not misread.",
    wellbeing: "Prioritise sleep. Meditation, prayer or a quiet evening suit the day.",
    tip: "Plan an early night; tomorrow will feel lighter.",
  },
];

export interface DailySky {
  /** IST calendar date, YYYY-MM-DD. */
  date: string;
  moonRashi: Rashi;
  moonNakshatra: string;
  moonPada: number;
  tithi: string;
  paksha: "Shukla" | "Krishna";
  sunRashi: Rashi;
}

/** The IST calendar date right now, YYYY-MM-DD. */
export function todayIst(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** Sky for an IST date, evaluated at 06:00 IST so a day's reading stays the same all day. */
export function skyForDate(dateIst: string): DailySky {
  const [y, m, d] = dateIst.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 0, 30)); // 06:00 IST
  const chart = computeChart(utc, 25.4358, 81.8463);
  const moon = chart.planets.find((p) => p.id === "Mo")!;
  const sun = chart.planets.find((p) => p.id === "Su")!;
  return {
    date: dateIst,
    moonRashi: RASHIS[moon.rashi - 1],
    moonNakshatra: moon.nakshatra,
    moonPada: moon.pada,
    tithi: chart.tithi.name,
    paksha: chart.tithi.paksha,
    sunRashi: RASHIS[sun.rashi - 1],
  };
}

/** House (1–12) the transiting Moon occupies counted from a given Moon sign. */
export function moonHouseFrom(natalRashi: number, moonRashi: number): number {
  return ((moonRashi - natalRashi + 12) % 12) + 1;
}

export function readingFor(natalRashi: number, sky: DailySky): { house: number; reading: HouseReading } {
  const house = moonHouseFrom(natalRashi, sky.moonRashi.n);
  return { house, reading: HOUSE_READINGS[house - 1] };
}
