import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Falta JWT_SECRET en .env");
  return new TextEncoder().encode(s);
};

const expiresDays = Number(process.env.JWT_EXPIRES_DAYS ?? 7);

export type AuthTokenPayload = {
  sub: string; // userId
};

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresDays}d`)
    .sign(secret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as AuthTokenPayload & { exp?: number; iat?: number };
}