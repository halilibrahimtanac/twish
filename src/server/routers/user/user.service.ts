import db from '@/db';
import { users, type User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '@/lib/password';
import { createAndSetSession } from '@/lib/auth';
import type { AddUserInput, LoginInput } from './user.input';
import { cookies } from 'next/headers';

export async function getAllUsers() {
  return db.select({ id: users.id, name: users.name }).from(users);
}

export async function createUser(input: AddUserInput): Promise<User> {
  const hashedPassword = await hashPassword(input.password);

  const newUser = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      username: input.username,
      email: input.email,
      password: hashedPassword,
    })
    .returning();

  return newUser[0];
}

export async function loginUser(input: LoginInput) {

  const foundUser = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (foundUser.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = foundUser[0];

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  await createAndSetSession(user);

  return {
    success: true,
    user: {
      email: user.email,
      username: user.username,
      name: user.name,
    },
  };
}

export async function logoutUser() {
    (await cookies()).set('session-token-twish', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1,
      path: '/',
    });
  
    return { success: true };
  }