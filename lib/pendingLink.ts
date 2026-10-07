/**
 * A product link waiting to be added: pasted on the landing page before signing up, or shared
 * into the app from a shop app. Kept in sessionStorage so it survives sign-up or a Google redirect
 * in the same tab, then opened in the Add product dialog on the first load of the app.
 */
const KEY = "haulbook:pending-link";

export interface PendingLink {
  url: string;
  title?: string | null;
}

export function savePendingLink(url: string, title?: string | null) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ url, title: title ?? null }));
  } catch {}
}

export function hasPendingLink() {
  try {
    return Boolean(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}

/** Returns the saved link once, then forgets it. */
export function takePendingLink(): PendingLink | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const data = raw.startsWith("{") ? (JSON.parse(raw) as PendingLink) : { url: raw };
    return /^https?:\/\//i.test(data.url) ? data : null;
  } catch {
    return null;
  }
}
