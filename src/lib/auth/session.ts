import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionUser, UserRole } from '@/types';

const SESSION_COOKIE_NAME = 'cinepulse_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET || '';
const SECRET_KEY = JWT_SECRET_STRING
  ? new TextEncoder().encode(JWT_SECRET_STRING)
  : null;

const SESSION_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Fail closed when the signing secret is missing in production: a predictable
 * fallback key would let anyone forge an admin session cookie.
 */
function getSecretKey(): Uint8Array {
  if (SECRET_KEY) return SECRET_KEY;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not configured. Set a random 32+ character secret in the environment before using authentication.'
    );
  }
  // Local development only fallback
  return new TextEncoder().encode('cinepulse-local-development-secret-not-for-production');
}

export interface SessionPayload {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneVerified: boolean;
  phoneNumber: string;
  iat: number;
  exp: number;
}

/**
 * Sign and issue a session JWT, setting an HTTP-Only Secure Cookie
 */
export async function createSession(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phoneVerified: user.phoneVerified,
    phoneNumber: user.phoneNumber,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_EXPIRATION)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRATION,
    path: '/',
  });

  return token;
}

/**
 * Retrieve and verify the current session from the HTTP cookie
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecretKey());
    const sessionData = payload as unknown as SessionPayload;

    return {
      id: sessionData.sub,
      email: sessionData.email,
      fullName: sessionData.fullName,
      role: sessionData.role,
      phoneVerified: sessionData.phoneVerified,
      phoneNumber: sessionData.phoneNumber,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side verification that the caller is an authenticated administrator
 * NEVER relies on client-supplied data or public email headers
 */
export async function verifyAdminSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  // Strict double check: role must be 'admin'
  if (session.role !== 'admin') {
    return null;
  }

  return session;
}

/**
 * Clear the current session cookie (Logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
