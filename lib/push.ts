import webpush from "web-push";
import { prisma } from "./prisma";

/** What the service worker shows. `url` opens when the notification is tapped. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let configured: boolean | null = null;

/** Web Push needs a key pair (VAPID). Without one, push is simply off. */
export function pushConfigured() {
  if (configured === null) {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    configured = Boolean(pub && priv);
    if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@haulbook.app", pub!, priv!);
  }
  return configured;
}

/**
 * Sends one notification to every device the user turned notifications on for.
 * Devices the push service reports as gone (uninstalled, permission revoked) are removed.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12, urgency: "normal" }
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          removed++;
        } else console.error(`Push failed for user ${userId}:`, status ?? e);
      }
    })
  );
  return { sent, removed };
}
