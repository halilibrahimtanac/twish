import db from "@/db";
import { publicProcedure, router } from "./trpc";
import { users } from "@/db/schema";
import { addUserInput, loginInput } from "./inputs";
import bcrypt from "bcrypt"
import { eq } from "drizzle-orm";
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const HASH_ROUND: number = 12;

export const appRouter = router({
  getUsers: publicProcedure.query(async () => {
    const res = await db.select({ id: users.id, name: users.name }).from(users);
    return res;
  }),
  addUser: publicProcedure.input(addUserInput).mutation(async ({ input }) => {
    const hashedPassword = await bcrypt.hash(input.password, HASH_ROUND);

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
  }),
  loginRoute: publicProcedure.input(loginInput).mutation(async ({ input }) => {
    // First find the user by email only
    const foundUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (foundUser.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = foundUser[0];
    
    // Compare the password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      username: user.username 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    // Set the cookie
    (await cookies()).set('session-token-twish', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return { success: true, user: {
      email: user.email,
      username: user.username,
      name: user.name
    }};
  })
});

export type AppRouter = typeof appRouter;
