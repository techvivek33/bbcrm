import "server-only";
import { cookies } from "next/headers";
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";

const COOKIE = "aos_session";
const SECRET = process.env.SESSION_SECRET ?? "insecure-dev-secret";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// --- Password hashing (scrypt; format: salt:hash) ---------------------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// --- Signed session cookie (value = userId, HMAC-signed) --------------------
function sign(value: string): string {
  const sig = createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed || !signed.includes(".")) return null;
  const idx = signed.lastIndexOf(".");
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", SECRET).update(value).digest("hex");
  if (sig.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return unsign(jar.get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;
