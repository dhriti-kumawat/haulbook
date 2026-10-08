import { aiConfigured, parseSimple, parseWithClaude } from "@/lib/voiceParse";
import { rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

/** Turns what a creator said ("got the boAt headphones from Amazon for 1999…") into Add product fields. */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!rateLimit(`voice-parse:${user.id}`, 40, 60 * 60_000)) {
    return NextResponse.json({ error: "That's a lot of products in an hour. Wait a bit and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
  if (transcript.length < 3) return NextResponse.json({ error: "Say a little more about the product." }, { status: 400 });
  if (transcript.length > 1500) return NextResponse.json({ error: "That's too long. Describe one product at a time." }, { status: 400 });
  const today = typeof body?.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);

  if (!aiConfigured()) return NextResponse.json({ fields: parseSimple(transcript), ai: false });
  try {
    return NextResponse.json({ fields: await parseWithClaude(transcript, today), ai: true });
  } catch (e) {
    console.error("Voice parse failed:", e);
    // Still give the creator something useful.
    return NextResponse.json({ fields: parseSimple(transcript), ai: false });
  }
}
