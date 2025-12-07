import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { eq } from "drizzle-orm";
import { pictures, users } from "@/db/schema";
import db from "@/db";
import { alias } from "drizzle-orm/sqlite-core";

async function comparePassword(password: string, hash: string) {
  return compare(password, hash);
}

export const authOptions: NextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || typeof credentials.email !== 'string' || typeof credentials.password !== 'string') return null;

        const profilePics = alias(pictures, "profile_pics");
        const backgroundPics = alias(pictures, "background_pics");

        const foundUser = await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            password: users.password,
            email: users.email,
            bio: users.bio,
            profilePictureUrl: profilePics.url,
            backgroundPictureUrl: backgroundPics.url,
          })
          .from(users)
          .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id))
          .leftJoin(backgroundPics, eq(users.backgroundPictureId, backgroundPics.id))
          .where(eq(users.email, credentials.email))
          .limit(1);

        const user = foundUser[0];
        if (!user) throw new Error("No such user found");

        const isPasswordValid = await comparePassword(credentials.password, user.password);
        if (!isPasswordValid) throw new Error("Password is incorrect");

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          bio: user.bio,
          profilePictureUrl: user.profilePictureUrl,
          backgroundPictureUrl: user.backgroundPictureUrl,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    session({ session, token }) {
      if (session.user) Object.assign(session.user, token);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
