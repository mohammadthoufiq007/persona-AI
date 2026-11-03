import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
  const s = process.env.SESSION_SECRET || 'dev_secret_at_least_32_bytes_long_fallback_1234567890';
  return new TextEncoder().encode(s);
};

const ttl = Number(process.env.SESSION_TTL_SECONDS ?? 7200);
const isProd = process.env.NODE_ENV === 'production';
export const COOKIE_NAME = isProd ? '__Host-pv_s' : 'pv_s';

export async function createSessionToken(sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sid as string) || null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ttl,
  };
}
