import { NextResponse } from "next/server";
import { searchIndianCities, type Place } from "@/lib/astro/places";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface GeoResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  admin1?: string;
}

/**
 * GET /api/places?q=Prayagraj → up to 8 places with coordinates and IANA time zone.
 * Built-in Indian cities answer instantly; the rest comes from the open Open-Meteo geocoding API (GeoNames data).
 */
export async function GET(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`places:${ip}`, 40, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ places: [] });

  const places: Place[] = searchIndianCities(q);
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } });
    if (res.ok) {
      const data = (await res.json()) as { results?: GeoResult[] };
      for (const r of data.results ?? []) {
        if (typeof r.latitude !== "number" || typeof r.longitude !== "number" || !r.timezone || !r.name) continue;
        const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
        if (places.some((p) => p.label.toLowerCase() === label.toLowerCase())) continue;
        places.push({ label, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone });
      }
    }
  } catch {
    // Geocoding service unreachable: the built-in cities above still work.
  }
  return NextResponse.json({ places: places.slice(0, 8) }, { headers: { "Cache-Control": "private, max-age=300" } });
}
