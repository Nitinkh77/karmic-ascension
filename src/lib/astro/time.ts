/** Offset (minutes east of UTC) of an IANA time zone at a given instant, using the platform's tz database. */
export function tzOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(at)) if (part.type !== "literal") p[part.type] = Number(part.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** Converts a wall-clock time in an IANA zone (e.g. "Asia/Kolkata") to the exact UTC instant. */
export function zonedLocalToUtc(y: number, mo: number, d: number, h: number, mi: number, timeZone: string): Date {
  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
  let utc = naive - tzOffsetMinutes(timeZone, new Date(naive)) * 60000;
  // Re-evaluate once at the candidate instant so a daylight-saving boundary is handled correctly.
  utc = naive - tzOffsetMinutes(timeZone, new Date(utc)) * 60000;
  return new Date(utc);
}
