import db from "@/db";
import { follows, pictures, users, type User } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { hashPassword, comparePassword } from "@/lib/password";
import { createAndSetSession } from "@/lib/auth";
import type { AddUserInput, GetUserProfileInfosInput, LoginInput, SaveUserInputType } from "./user.input";
import { cookies } from "next/headers";
import { alias } from "drizzle-orm/pg-core";

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

export async function getUserProfileInfos(input: GetUserProfileInfosInput) {
  const ALLOWED_SINGLE_FIELDS = ["name", "username", "id"] as const;
  const { id, field } = input;

  if (field) {
    if (!(ALLOWED_SINGLE_FIELDS as readonly string[]).includes(field)) {
      throw new Error(`Invalid or unauthorized field requested: ${field}`);
    }

    const foundUser = await db
      .select({
        [field]: users[field],
      })
      .from(users)
      .where(or(eq(users.id, id), eq(users.username, id)))
      .limit(1);

    return foundUser[0];
  }

  const profilePics = alias(pictures, "profile_pics");
  const backgroundPics = alias(pictures, "background_pics");
  
  const followerCounts = db.$with("follower_counts").as(
    db.select({
      followingId: follows.followingId,
      followerCount: sql<number>`count(${follows.followingId})`.as("followerCount")
    })
    .from(follows)
    .leftJoin(users, or(eq(users.id, id), eq(users.username, id)))
    .where(eq(follows.followingId, users.id))
    .groupBy(follows.followingId)
  );
  
  const followingCounts = db.$with("following_counts").as(
    db.select({
      followerId: follows.followerId,
      followingCount: sql<number>`count(${follows.followerId})`.as("followingCount")
    })
    .from(follows)
    .leftJoin(users, or(eq(users.id, id), eq(users.username, id)))
    .where(eq(follows.followerId, users.id))
    .groupBy(follows.followerId)
  );
  
  const foundUser = await db.with(followerCounts, followingCounts)
    .select({
        id: users.id,
        email: users.email,
        name: users.name,
        bio: users.bio,
        username: users.username,
        profilePictureUrl: profilePics.url,
        backgroundPictureUrl: backgroundPics.url,
        location: users.location,
        followerCount: sql<number>`COALESCE(${followerCounts.followerCount}, 0)`,
        followingCount: sql<number>`COALESCE(${followingCounts.followingCount}, 0)`
    })
    .from(users)
    .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id))
    .leftJoin(backgroundPics, eq(users.backgroundPictureId, backgroundPics.id))
    .leftJoin(followerCounts, eq(followerCounts.followingId, users.id))
    .leftJoin(followingCounts, eq(followingCounts.followerId, users.id))
    .where(or(eq(users.id, id), eq(users.username, id)))
    .limit(1);

  return foundUser[0];
}

export async function saveUserInfoService(userId: string, input: SaveUserInputType) {
  const updateData: {
    name?: string;
    bio?: string | null;
    location?: string | null;
    profilePictureId?: string;
    backgroundPictureId?: string;
  } = {};

  if (input.name) {
    updateData.name = input.name;
  }

  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }
  if (input.location !== undefined) {
    updateData.location = input.location;
  }

  if (input.profilePictureUrl) {
    const newProfilePictureRow = await db
      .insert(pictures)
      .values({
        id: crypto.randomUUID(),
        type: "profile_picture",
        url: input.profilePictureUrl,
        uploadedBy: userId,
      })
      .returning({ insertedId: pictures.id });

    updateData.profilePictureId = newProfilePictureRow[0].insertedId;
  }

  if (input.backgroundPictureUrl) {
    const newBackgroundPictureRow = await db
      .insert(pictures)
      .values({
        id: crypto.randomUUID(),
        type: "background_picture",
        url: input.backgroundPictureUrl,
        uploadedBy: userId,
      })
      .returning({ insertedId: pictures.id });
      
    updateData.backgroundPictureId = newBackgroundPictureRow[0].insertedId;
  }

  if (Object.keys(updateData).length === 0) {
    return await db.query.users.findFirst({ where: eq(users.id, userId) });
  }

  return await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();
}
