import { createHash, randomBytes } from "node:crypto";

export const RESET_TTL_MS = 60 * 60 * 1000;
export const MIN_PASSWORD = 8;

/** A random token for the email link, and the hash that is stored instead of it. */
export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
