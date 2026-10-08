import { previewLink, PreviewError } from "@/lib/linkPreview";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

/** Reads a product link and returns its name, photo, price and shop. Signed-in users only. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!(await rateLimit(`link-preview:${user.id}`, 30, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many links at once. Wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.url !== "string" || !body.url.trim() || body.url.length > 2000) {
    return NextResponse.json({ error: "Paste a product link." }, { status: 400 });
  }
  try {
    return NextResponse.json(await previewLink(body.url));
  } catch (e) {
    const message = e instanceof PreviewError ? e.message : "Couldn't read that link.";
    if (!(e instanceof PreviewError)) console.error("Link preview failed:", e);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
