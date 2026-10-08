import { prisma } from "./prisma";

/**
 * Rate limiter shared by every server instance: at most `limit` hits per `windowMs` for each key,
 * counted in the database with one atomic statement. If the database can't be reached it falls back
 * to a per-instance in-memory count, so a database hiccup never locks everyone out.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + (${windowMs} * interval '1 millisecond'))
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    if (Math.random() < 0.01) {
      // Now and then, clear out expired counters so the table stays small.
      prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {});
    }
    return Number(rows[0]?.count ?? 0) <= limit;
  } catch (e) {
    console.error("Rate limit store unavailable, using memory:", e);
    return memoryLimit(key, limit, windowMs);
  }
}

const globalHits = globalThis as unknown as { __rateHits?: Map<string, number[]> };
const hits: Map<string, number[]> = (globalHits.__rateHits ??= new Map());

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) for (const k of [...hits.keys()].slice(0, 2_000)) hits.delete(k);
  return true;
}

/** Client IP. On Vercel the platform sets x-forwarded-for, so it can't be spoofed by the client. */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string) =>
    headers instanceof Headers ? headers.get(name) : ([] as string[]).concat(headers[name] ?? [])[0] ?? null;
  return get("x-forwarded-for")?.split(",")[0].trim() || get("x-real-ip") || "unknown";
}
