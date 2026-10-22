// Pure slot logic (no framework imports) so it is easy to unit-test.
// Business time zone: Asia/Kolkata = UTC+05:30, no daylight saving.

export const TZ = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

export interface SlotRule {
  weekday: number; // 0 = Sunday
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  is_active: boolean;
}

export interface SlotUnavailable {
  starts_at: string;
  ends_at: string;
}

export interface SlotSettings {
  slot_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_advance_days: number;
}

export interface Slot {
  startsAt: string; // ISO (UTC)
  label: string; // "7:00 PM"
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** IST wall-clock date + "HH:MM" → absolute Date. */
export function istToDate(date: string, hhmm: string): Date {
  return new Date(`${date}T${hhmm.slice(0, 5)}:00${IST_OFFSET}`);
}

/** Today's (or any instant's) calendar date in IST as YYYY-MM-DD. */
export function istDateString(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // en-CA → YYYY-MM-DD
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Weekday (0=Sun) of a calendar date; independent of time zone. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

const toMinutes = (t: string): number => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTimeIst(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toUpperCase();
}

export function formatDateTimeIst(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateIst(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function generateSlots(args: {
  date: string; // YYYY-MM-DD (IST)
  durationMinutes: number;
  rules: SlotRule[];
  settings: SlotSettings;
  unavailable: SlotUnavailable[];
  now?: Date;
}): Slot[] {
  const { date, durationMinutes, rules, settings, unavailable } = args;
  const now = args.now ?? new Date();
  if (!DATE_RE.test(date)) return [];

  const rule = rules.find((r) => r.weekday === weekdayOf(date) && r.is_active);
  if (!rule) return [];

  const earliest = now.getTime() + settings.min_notice_hours * 3_600_000;
  const latest = now.getTime() + (settings.max_advance_days + 1) * 86_400_000;
  const step = Math.max(5, settings.slot_minutes);
  const startMin = toMinutes(rule.start_time);
  const endMin = toMinutes(rule.end_time);
  const busy = unavailable.map((u) => ({
    s: new Date(u.starts_at).getTime(),
    e: new Date(u.ends_at).getTime(),
  }));

  const slots: Slot[] = [];
  for (let m = startMin; m + durationMinutes <= endMin; m += step) {
    const start = istToDate(date, `${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    const t = start.getTime();
    if (t < earliest || t > latest) continue;
    const held = t + (durationMinutes + settings.buffer_minutes) * 60_000;
    if (busy.some((b) => t < b.e && held > b.s)) continue;
    slots.push({ startsAt: start.toISOString(), label: formatTimeIst(start) });
  }
  return slots;
}

/** Candidate dates (IST) in the booking window whose weekday has an active rule. */
export function candidateDates(rules: SlotRule[], settings: SlotSettings, now = new Date()): string[] {
  const active = new Set(rules.filter((r) => r.is_active).map((r) => r.weekday));
  const today = istDateString(now);
  const out: string[] = [];
  for (let i = 0; i <= settings.max_advance_days; i++) {
    const d = addDays(today, i);
    if (active.has(weekdayOf(d))) out.push(d);
  }
  return out;
}
