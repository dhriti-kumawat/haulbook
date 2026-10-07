import { PRODUCT_TYPES } from "./products";

const TEXT_FIELDS = { title: 120, shop: 40, deliverables: 120, notes: 2000 } as const;
const URL_FIELDS = ["url", "imageUrl", "postUrl"] as const;
/** About 300 KB of image data once base64-encoded. */
const MAX_PHOTO_CHARS = 420_000;
const MONEY_FIELDS = ["price", "fee"] as const;
const DATE_FIELDS = [
  "orderedAt", "deliveredAt", "filmedAt", "postedAt", "returnedAt",
  "refundedAt", "keptAt", "paidAt", "returnBy", "postBy",
] as const;

/**
 * Picks and validates product fields a client may set.
 * `partial` = update (only fields present are checked); otherwise `title` is required.
 */
export function parseProductInput(body: any, partial: boolean): { data?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request" };
  const data: Record<string, unknown> = {};

  for (const [key, max] of Object.entries(TEXT_FIELDS)) {
    if (body[key] === undefined) continue;
    if (body[key] === null || body[key] === "") {
      if (key === "title") return { error: "Title is required" };
      data[key] = null;
      continue;
    }
    if (typeof body[key] !== "string") return { error: `Invalid ${key}` };
    const v = body[key].trim();
    if (v.length > max) return { error: `${key} is too long` };
    if (key === "title" && !v) return { error: "Title is required" };
    data[key] = v;
  }
  if (!partial && !data.title) return { error: "Title is required" };

  if (body.type !== undefined) {
    if (!PRODUCT_TYPES.includes(body.type)) return { error: "Type must be bought, pr or collab" };
    data.type = body.type;
  }

  for (const key of URL_FIELDS) {
    if (body[key] === undefined) continue;
    if (body[key] === null || body[key] === "") {
      data[key] = null;
      continue;
    }
    // Uploaded photos are stored inline as small, already-compressed images.
    if (key === "imageUrl" && typeof body[key] === "string" && body[key].startsWith("data:")) {
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body[key])) return { error: "Photo must be a JPEG, PNG or WebP image" };
      if (body[key].length > MAX_PHOTO_CHARS) return { error: "Photo is too large" };
      data[key] = body[key];
      continue;
    }
    try {
      const u = new URL(String(body[key]).trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      data[key] = u.toString();
    } catch {
      return { error: "Links must start with http:// or https://" };
    }
  }

  for (const key of MONEY_FIELDS) {
    if (body[key] === undefined) continue;
    if (body[key] === null || body[key] === "") {
      data[key] = null;
      continue;
    }
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) return { error: "Amounts must be positive numbers" };
    data[key] = n;
  }

  if (body.returnWindowDays !== undefined) {
    if (body.returnWindowDays === null || body.returnWindowDays === "") data.returnWindowDays = null;
    else {
      const n = Number(body.returnWindowDays);
      if (!Number.isInteger(n) || n < 0 || n > 365) return { error: "Return window must be 0–365 days" };
      data.returnWindowDays = n;
    }
  }

  for (const key of DATE_FIELDS) {
    if (body[key] === undefined) continue;
    if (body[key] === null || body[key] === "") {
      if (key === "orderedAt") return { error: "Order date is required" };
      data[key] = null;
      continue;
    }
    const d = new Date(body[key]);
    if (isNaN(d.getTime())) return { error: `Invalid date for ${key}` };
    data[key] = d;
  }

  // Returning and keeping are opposites.
  if (data.returnedAt) data.keptAt = null;
  if (data.keptAt) {
    data.returnedAt = null;
    data.refundedAt = null;
  }
  return { data };
}

const AFTER_DELIVERY = ["filmedAt", "postedAt", "returnedAt", "refundedAt", "paidAt", "keptAt"] as const;

/**
 * Filming, posting, returning, keeping or being paid all mean the product arrived. If any of those is
 * set while "delivered" is empty (old data, an API call, ticking out of order), fill it with the
 * earliest of them, so the product's step and its checklist always agree.
 */
export function ensureDelivered(data: Record<string, unknown>, existing: Record<string, unknown> = {}) {
  const value = (k: string) => (k in data ? data[k] : existing[k]) as Date | string | null | undefined;
  if (value("deliveredAt")) return data;
  const dates = AFTER_DELIVERY.map((k) => value(k)).filter(Boolean).map((d) => new Date(d as string | Date));
  if (dates.length) data.deliveredAt = new Date(Math.min(...dates.map((d) => d.getTime())));
  return data;
}
