/**
 * Simple in-memory rate limiter: at most `limit` hits per `windowMs` for each key.
 * Good enough for one server; with several server instances, each keeps its own count,
 * so swap this for a shared store (e.g. Redis/Upstash) before scaling out.
 */
const globalHits = globalThis as unknown as { __rateHits?: Map<string, number[]> };
const hits: Map<string, number[]> = (globalHits.__rateHits ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    // Drop the oldest keys so memory stays bounded.
    for (const k of [...hits.keys()].slice(0, 2_000)) hits.delete(k);
  }
  return true;
}

/** Best-effort client IP from proxy headers. */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string) =>
    headers instanceof Headers ? headers.get(name) : ([] as string[]).concat(headers[name] ?? [])[0] ?? null;
  return get("x-forwarded-for")?.split(",")[0].trim() || get("x-real-ip") || "unknown";
}
