/**
 * Page copy for each consultation's dedicated page, used when the service has no features of its own in the database.
 * Everything here restates what the consultation's own description says; nothing is promised beyond it.
 * Anything entered in Admin → Services & pricing (features, deliverables, description) takes priority.
 */
export interface ServiceCopy {
  /** Short "who is this for" line. */
  goodFor: string;
  /** What the session looks at (taken from the consultation description). */
  covers: string[];
  /** What to have ready. */
  prepare: string[];
  /** Optional honest caveat shown on the page. */
  note?: string;
}

const BIRTH = ["Your date of birth", "Your exact time of birth (as accurate as you can find; a birth certificate or hospital record is best)", "Your place of birth (town or city and state or country)"];

export const SERVICE_COPY: Record<string, ServiceCopy> = {
  "full-consultation": {
    goodFor: "A broad, whole-life reading of your chart rather than one question.",
    covers: ["Your behavioural tendencies", "Family lineage", "Prārabdha and sañcita karma", "Past-life imprints"],
    prepare: BIRTH,
  },
  "past-life-pending-karma-reading": {
    goodFor: "Understanding the karmic patterns your chart points to from past lives.",
    covers: ["Past-life influences shown in the chart", "Pending karma and how it may be showing up now"],
    prepare: BIRTH,
  },
  "marriage-consultation": {
    goodFor: "Questions about marriage, partnership and married life.",
    covers: ["Your nature and habits", "Marital tendencies", "The quality and direction of married life"],
    prepare: [...BIRTH, "If relevant, your partner's birth details"],
  },
  "career-consultation": {
    goodFor: "Direction and clarity about work and vocation.",
    covers: ["Your natural tendencies", "Your work ethic", "A soul-aligned career path"],
    prepare: BIRTH,
  },
  "health-consultation": {
    goodFor: "Gaining astrological insight into physical and mental wellbeing.",
    covers: ["Insight into physical wellbeing", "Insight into mental wellbeing"],
    prepare: BIRTH,
    note: "This is an astrological perspective, not a medical diagnosis or treatment. Please continue to consult your doctor for health concerns.",
  },
  "prashna-consultation": {
    goodFor: "When your birth time is not known. A Prashna chart is cast for the moment of your question.",
    covers: ["Up to two questions from you", "A detailed analysis of the Prashna chart"],
    prepare: ["Your two questions, written down and as specific as possible", "A quiet moment to ask them with a clear mind"],
  },
  "birth-time-rectification": {
    goodFor: "When your birth time is uncertain and you want it determined more accurately.",
    covers: ["Astrological techniques to determine your birth time more accurately"],
    prepare: [...BIRTH.slice(0, 1), "Your approximate time of birth, if you have one", ...BIRTH.slice(2), "Dates of important life events (education, career changes, marriage, moves, births, losses)"],
  },
  "tarot-card-reading": {
    goodFor: "Insight and clarity on where you are in life's journey.",
    covers: ["Insight into past, present and future themes", "Clarity on your life's journey"],
    prepare: ["The question or area of life you want clarity on"],
  },
  "dasha-analysis": {
    goodFor: "Knowing what your coming planetary period (daśā) emphasises, and how to work with it.",
    covers: ["A thorough analysis of your upcoming daśā", "Remedies", "Personalised, favourable activities"],
    prepare: BIRTH,
  },
};

export const copyFor = (slug: string): ServiceCopy | null => SERVICE_COPY[slug] ?? null;

export const BOOKING_STEPS = [
  { title: "Choose a time", text: "Pick a date and an open time slot (IST)." },
  { title: "Share your details", text: "Your contact details and, where needed, your birth details." },
  { title: "Pay as instructed", text: "Payment details are shown after you book; your booking is confirmed once payment is verified." },
  { title: "Attend your session", text: "You are contacted with the details for your consultation at the booked time." },
] as const;
