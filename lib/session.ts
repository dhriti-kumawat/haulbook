import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/** Returns the signed-in user, or a ready-made error response. */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  // Instagram accounts have no email, so the account id is what identifies them.
  if (!session?.user?.id && !session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = session.user.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  // Sessions issued before the password last changed (a reset) are no longer valid.
  if (user.passwordChangedAt && (session.issuedAt ?? 0) * 1000 < user.passwordChangedAt.getTime() - 1000) {
    return { error: NextResponse.json({ error: "Your password was changed. Sign in again." }, { status: 401 }) };
  }
  return { user };
}

export const ORDER_STATUSES = ["Ordered", "Shipped", "Delivered", "Pending"] as const;

/** Picks and validates the order fields a client may set. Returns an error string when invalid. */
export function parseOrderFields(body: any, partial: boolean) {
  const data: Record<string, unknown> = {};

  if (body.orderID !== undefined || !partial) {
    if (body.orderID != null && typeof body.orderID !== "string") return { error: "Invalid order ID" };
    data.orderID = (body.orderID ?? "").trim();
  }
  if (body.platform !== undefined || !partial) {
    if (body.platform != null && typeof body.platform !== "string") return { error: "Invalid shop" };
    data.platform = (body.platform ?? "").trim() || "Other";
  }
  if (body.status !== undefined || !partial) {
    if (!ORDER_STATUSES.includes(body.status)) return { error: "Unknown status" };
    data.status = body.status;
  }
  if (body.amount !== undefined || !partial) {
    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount < 0) return { error: "Amount must be a positive number" };
    data.amount = amount;
  }
  if (body.deliveryDate !== undefined) {
    const d = body.deliveryDate ? new Date(body.deliveryDate) : null;
    if (d && isNaN(d.getTime())) return { error: "Invalid delivery date" };
    data.deliveryDate = d;
  }
  return { data };
}

/** Reads an optional item price. Returns undefined when absent, or an error string when invalid. */
export function parsePrice(value: unknown): { price?: number | null; error?: string } {
  if (value === undefined) return {};
  if (value === null || value === "") return { price: null };
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return { error: "Price must be a positive number" };
  return { price: n };
}

/** Picks and validates shop fields. */
export function parseShopFields(body: any, partial: boolean) {
  const data: { name?: string; policyDays?: number } = {};
  if (body.name !== undefined || !partial) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 40) return { error: "Shop name must be 1–40 characters" };
    data.name = name;
  }
  if (body.policyDays !== undefined || !partial) {
    const days = Number(body.policyDays ?? 7);
    if (!Number.isInteger(days) || days < 0 || days > 365) return { error: "Return window must be 0–365 days" };
    data.policyDays = days;
  }
  return { data };
}
