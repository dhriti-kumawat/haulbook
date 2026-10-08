import { rateLimit } from "@/lib/rateLimit";
import { requireUser } from "@/lib/session";
import { sendPush } from "@/lib/push";
import { NextResponse } from "next/server";

/** Sends a sample notification to the signed-in user's devices. */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!(await rateLimit(`test-push:${user.id}`, 5, 60 * 60_000))) {
    return NextResponse.json({ error: "That's enough tests for now. Try again in an hour." }, { status: 429 });
  }
  const { sent } = await sendPush(user.id, {
    title: "Haulbook notifications are on",
    body: "You'll get a short nudge here on days a return, post, refund or payment needs you.",
    url: "/home",
    tag: "haulbook-test",
  });
  if (!sent) return NextResponse.json({ error: "No device is set up for notifications yet." }, { status: 400 });
  return NextResponse.json({ sent });
}
