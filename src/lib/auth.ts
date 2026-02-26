import crypto from "crypto";

type AnyObj = Record<string, any>;

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: AnyObj) {
  return b64url(JSON.stringify(obj));
}

function b64urlToJson<T = any>(b64: string): T | null {
  try {
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const s = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const raw = Buffer.from(s, "base64").toString("utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hmacSha256(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export type AuthPayload = {
  sub: string;          // userId
  usuario: string;      // username
  roleIds?: number[];   // opcional
  iat: number;
  exp: number;
};

export function signJwt(payload: Omit<AuthPayload, "iat" | "exp">, expiresInSec = 60 * 60 * 24 * 7) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET en .env");

  const now = Math.floor(Date.now() / 1000);
  const full: AuthPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const h = b64urlJson(header);
  const p = b64urlJson(full);
  const data = `${h}.${p}`;
  const sig = b64url(hmacSha256(data, secret));
  return `${data}.${sig}`;
}

export async function verifyJwt(token: string): Promise<AuthPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  const [h, p, sig] = parts;
  const data = `${h}.${p}`;
  const expected = b64url(hmacSha256(data, secret));

  // timing-safe compare
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const payload = b64urlToJson<AuthPayload>(p);
  if (!payload?.sub || !payload?.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return payload;
}