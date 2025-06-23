import db from "@/db";
import { pictures, users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "@/lib/password";
import { createAndSetSession } from "@/lib/auth";
import type { AddUserInput, LoginInput } from "./user.input";
import { cookies } from "next/headers";
import { alias } from "drizzle-orm/sqlite-core";

export async function getAllUsers() {
  return db.select({ id: users.id, name: users.name }).from(users);
}

export async function createUser(input: AddUserInput): Promise<User> {
  const hashedPassword = await hashPassword(input.password);

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        username: input.username,
        email: input.email,
        password: hashedPassword,
      })
      .returning();

    return newUser;
  } catch (err) {
    if (!err || typeof err !== "object") {
      throw err;
    }

    const message = (err as Error).message;

    if (message.includes("users.email")) {
      throw new Error(
        JSON.stringify({
          email: "An account with that email already exists.",
        })
      );
    }

    if (message.includes("users.username")) {
      throw new Error(
        JSON.stringify({
          username: "That username is already taken.",
        })
      );
    }

    throw new Error(
      JSON.stringify({
        error: "Unable to create user at this time.",
      })
    );
  }
}

export async function loginUser(input: LoginInput) {
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
    .where(eq(users.email, input.email))
    .limit(1);

  if (foundUser.length === 0) {
    // Throw error as an object with the field as key
    throw new Error(JSON.stringify({ email: "No such user found" }));
  }

  const user = foundUser[0];

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    // Throw error as an object with the field as key
    throw new Error(JSON.stringify({ password: "Password is incorrect" }));
  }

  await createAndSetSession(user);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      backgroundPictureUrl: user.backgroundPictureUrl,
    },
  };
}

export async function logoutUser() {
  (await cookies()).set("session-token-twish", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: -1,
    path: "/",
  });

  return { success: true };
}

export async function getUserProfileInfos(id: string){
  const profilePics = alias(pictures, "profile_pics");
  const backgroundPics = alias(pictures, "background_pics");

  const foundUser = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profilePictureUrl: profilePics.url,
      backgroundPictureUrl: backgroundPics.url,
    })
    .from(users)
    .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id))
    .leftJoin(backgroundPics, eq(users.backgroundPictureId, backgroundPics.id))
    .where(eq(users.id, id))
    .limit(1);
  
  return foundUser[0]
}
