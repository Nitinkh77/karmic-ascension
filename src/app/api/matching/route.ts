import { NextResponse } from "next/server";
import { z } from "zod";
import { computeChart } from "@/lib/astro/chart";
import { RASHIS } from "@/lib/astro/constants";
import { ashtakoota } from "@/lib/astro/matching";
import { isValidTimeZone } from "@/lib/astro/places";
import { zonedLocalToUtc } from "@/lib/astro/time";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const person = z.object({
  name: z.string().trim().max(80).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: z.string().trim().min(2).max(160),
  latitude: z.number().min(-66).max(66),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(60).refine(isValidTimeZone, "Unknown time zone"),
});
const schema = z.object({ groom: person, bride: person });

/** Mars in these houses from the Lagna is the usual Manglik (Mangal dosha) rule. */
const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

function analyse(v: z.infer<typeof person>) {
  const [y, m, d] = v.date.split("-").map(Number);
  const [hh, mm] = v.time.split(":").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (y < 1800 || y > 2100 || probe.getUTCMonth() !== m - 1) throw new Error("date");
  if (Date.UTC(y, m - 1, d) > Date.now() + 366 * 86400_000) throw new Error("future");
  const utc = zonedLocalToUtc(y, m, d, hh, mm, v.timezone);
  const chart = computeChart(utc, v.latitude, v.longitude);
  const moon = chart.planets.find((p) => p.id === "Mo")!;
  const mars = chart.planets.find((p) => p.id === "Ma")!;
  return {
    name: v.name || null,
    place: v.place,
    moonLon: moon.lon,
    summary: {
      lagna: RASHIS[chart.ascendant.rashi - 1].sanskrit,
      moonSign: RASHIS[moon.rashi - 1].sanskrit,
      moonSignEnglish: RASHIS[moon.rashi - 1].english,
      nakshatra: moon.nakshatra,
      pada: moon.pada,
    },
    manglik: { house: mars.house, is: MANGLIK_HOUSES.includes(mars.house) },
  };
}

/**
 * POST /api/matching → Ashtakoota (36-point) match for two birth details, plus a Manglik check.
 * Nothing is stored: details are used for this one calculation and discarded.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`matching:${ip}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many matches requested. Please try again in a few minutes." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check both birth details and try again." }, { status: 400 });

  try {
    const groom = analyse(parsed.data.groom);
    const bride = analyse(parsed.data.bride);
    const match = ashtakoota({ moonLon: groom.moonLon }, { moonLon: bride.moonLon });
    const strip = ({ moonLon: _m, ...rest }: typeof groom) => rest;
    return NextResponse.json(
      { groom: strip(groom), bride: strip(bride), match },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof Error && (e.message === "date" || e.message === "future")) {
      return NextResponse.json({ error: "Enter valid birth dates between 1800 and today." }, { status: 400 });
    }
    console.error("[api/matching]", e);
    return NextResponse.json({ error: "Could not calculate the match." }, { status: 500 });
  }
}
