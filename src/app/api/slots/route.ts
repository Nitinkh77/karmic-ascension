import { NextResponse } from "next/server";
import { getBookingMode } from "@/lib/booking/config";
import { generateSlots } from "@/lib/booking/slots";
import { getAvailabilityRules, getServiceBySlug, getSettings, getUnavailable } from "@/lib/data";
import { addDays } from "@/lib/booking/slots";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { slotQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/slots?service=<slug>&date=YYYY-MM-DD → open slots for that IST date.
 * Public and read-only: returns only start times, never customer data.
 */
export async function GET(req: Request) {
  if (!getBookingMode().enabled) {
    return NextResponse.json({ error: "Booking is not available." }, { status: 503 });
  }
  const ip = await clientIp();
  if (!rateLimit(`slots:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = slotQuerySchema.safeParse({
    service: url.searchParams.get("service") ?? "",
    date: url.searchParams.get("date") ?? "",
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const [service, rules, settings] = await Promise.all([
      getServiceBySlug(parsed.data.service),
      getAvailabilityRules(),
      getSettings(),
    ]);
    if (!service) return NextResponse.json({ error: "Unknown consultation." }, { status: 404 });

    const unavailable = await getUnavailable(parsed.data.date, addDays(parsed.data.date, 1));
    const slots = generateSlots({
      date: parsed.data.date,
      durationMinutes: service.duration_minutes,
      rules,
      settings,
      unavailable,
    });
    return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/slots]", e);
    return NextResponse.json({ error: "Could not load slots." }, { status: 500 });
  }
}
