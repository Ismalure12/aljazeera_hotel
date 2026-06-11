import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'auth-token';

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Gets session and ensures role is present.
 * Falls back to DB lookup for older JWTs missing role.
 * Requires prisma to be passed in to avoid circular imports.
 */
export async function getSessionWithRole(prismaClient) {
  const session = await getSession();
  if (!session) return null;

  if (!session.role && session.userId) {
    const user = await prismaClient.adminUser.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (user) return { ...session, role: user.role };
  }

  return session;
}

export async function requireAdmin(prismaClient) {
  const session = await getSessionWithRole(prismaClient);
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

export function createAuthCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
