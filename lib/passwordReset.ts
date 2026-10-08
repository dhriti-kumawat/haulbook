import { createHash, randomBytes } from "node:crypto";

export const RESET_TTL_MS = 60 * 60 * 1000;
export const MIN_PASSWORD = 8;
/** bcrypt only reads the first 72 bytes; a cap also stops huge inputs from tying up the server. */
export const MAX_PASSWORD = 128;
/** bcrypt work factor for new hashes. */
export const BCRYPT_COST = 12;

export const normalizeEmail = (email: unknown) => (typeof email === "string" ? email.trim().toLowerCase() : "");
export const isEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** A random token for the email link, and the hash that is stored instead of it. */
export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
