import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt"; 
import { alias } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";
import { pictures, users } from "@/db/schema";
import db from "@/db";

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

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

        if (foundUser.length === 0) {
          throw new Error("No such user found");
        }

        const user = foundUser[0];
        const isPasswordValid = await comparePassword(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Password is incorrect");
        }

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
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.bio = user.bio;
        token.profilePictureUrl = user.profilePictureUrl;
        token.backgroundPictureUrl = user.backgroundPictureUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.bio = token.bio as string | null;
        session.user.profilePictureUrl = token.profilePictureUrl as string | null;
        session.user.backgroundPictureUrl = token.backgroundPictureUrl as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };