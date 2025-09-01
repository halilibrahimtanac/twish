import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/db/schema';

/**
 * @param user - The user object to embed in the token.
 */
export async function createAndSetSession(user: Pick<User, 'id' | 'email' | 'username'>) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
  }

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
  }).setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);

  (await cookies()).set('session-token-twish', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}