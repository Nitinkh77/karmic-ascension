import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * LIMITATION (documented in README): memory is per server instance, so on
 * serverless platforms (Vercel) the effective limit is per warm instance. It
 * blunts casual abuse; the durable backstop is inside create_booking()
 * (max 3 pending requests per e-mail/phone per 24h) plus the exclusion
 * constraint. For stronger guarantees add Upstash/Vercel KV later.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0]?.trim() : h.get("x-real-ip")) || "unknown";
}
