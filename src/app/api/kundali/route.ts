import { NextResponse } from "next/server";
import { z } from "zod";
import { computeChart, vimshottari } from "@/lib/astro/chart";
import { isValidTimeZone } from "@/lib/astro/places";
import { zonedLocalToUtc, tzOffsetMinutes } from "@/lib/astro/time";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: z.string().trim().min(2).max(160),
  latitude: z.number().min(-66).max(66),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(60).refine(isValidTimeZone, "Unknown time zone"),
});

/**
 * POST /api/kundali → sidereal (Lahiri) birth chart, whole-sign houses and Vimshottari dasha.
 * Nothing is stored: the birth details are used for this one calculation and discarded.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`kundali:${ip}`, 12, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many charts requested. Please try again in a few minutes." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the birth details and try again." }, { status: 400 });
  const v = parsed.data;

  const [y, m, d] = v.date.split("-").map(Number);
  const [hh, mm] = v.time.split(":").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (y < 1800 || y > 2100 || probe.getUTCMonth() !== m - 1) {
    return NextResponse.json({ error: "Enter a valid date between 1800 and 2100." }, { status: 400 });
  }
  if (Date.UTC(y, m - 1, d) > Date.now() + 366 * 86400_000) {
    return NextResponse.json({ error: "The birth date cannot be in the future." }, { status: 400 });
  }

  try {
    const utc = zonedLocalToUtc(y, m, d, hh, mm, v.timezone);
    const chart = computeChart(utc, v.latitude, v.longitude);
    const moon = chart.planets.find((p) => p.id === "Mo")!;
    const dasha = vimshottari(moon.lon, utc);
    return NextResponse.json(
      {
        name: v.name || null,
        place: v.place,
        timezone: v.timezone,
        utcOffsetMinutes: tzOffsetMinutes(v.timezone, utc),
        local: { date: v.date, time: v.time },
        chart,
        dasha,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[api/kundali]", e);
    return NextResponse.json({ error: "Could not calculate the chart." }, { status: 500 });
  }
}
