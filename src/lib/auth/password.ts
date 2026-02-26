// src/lib/password.ts
import crypto from "crypto";

export function hashPassword(plain: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string) {
  try {
    const [alg, saltHex, hashHex] = String(stored).split("$");
    if (alg !== "scrypt" || !saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = crypto.scryptSync(plain, salt, expected.length);

    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}