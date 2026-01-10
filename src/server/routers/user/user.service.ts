import type {
  AddUserInput,
  GetUserProfileInfosInput,
  LoginInput,
  SaveUserInputType,
} from "./user.input";
import type { User } from "@/db/schema";
import { hashPassword, comparePassword } from "@/lib/password";
import { createAndSetSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { ParamType, queryRaw, SqlParam } from "@/db/neon";

const USER_RETURNING = `
  id,
  email,
  username,
  name,
  password,
  bio,
  profile_picture_id AS "profilePictureId",
  background_picture_id AS "backgroundPictureId",
  location,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function getAllUsers() {
  return queryRaw<{ id: string; name: string }>(
    `
    SELECT id, name
    FROM users
    `
  );
}

export async function createUser(input: AddUserInput): Promise<User> {
  const hashedPassword = await hashPassword(input.password);
  const id = crypto.randomUUID();

  try {
    const [newUser] = await queryRaw<User>(
      `
      INSERT INTO users (id, name, username, email, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${USER_RETURNING}
      `,
      [id, input.name, input.username, input.email, hashedPassword]
    );

    return newUser;
  } catch (err) {
    if (!err || typeof err !== "object") {
      throw err;
    }

    const error = err as { message?: string; code?: string; constraint?: string };
    const message = error.message ?? "";
    const constraint = error.constraint ?? "";

    if (error.code === "23505") {
      if (
        constraint.includes("users_email") ||
        message.includes("users_email") ||
        message.includes("users.email")
      ) {
        throw new Error(
          JSON.stringify({
            email: "An account with that email already exists.",
          })
        );
      }

      if (
        constraint.includes("users_username") ||
        message.includes("users_username") ||
        message.includes("users.username")
      ) {
        throw new Error(
          JSON.stringify({
            username: "That username is already taken.",
          })
        );
      }
    }

    throw new Error(
      JSON.stringify({
        error: "Unable to create user at this time.",
      })
    );
  }
}

export async function loginUser(input: LoginInput) {
  const foundUser = await queryRaw<{
    id: string;
    name: string;
    username: string;
    password: string;
    email: string;
    bio: string | null;
    profilePictureUrl: string | null;
    backgroundPictureUrl: string | null;
  }>(
    `
    SELECT
      users.id,
      users.name,
      users.username,
      users.password,
      users.email,
      users.bio,
      profile_pics.url AS "profilePictureUrl",
      background_pics.url AS "backgroundPictureUrl"
    FROM users
    LEFT JOIN pictures AS profile_pics
      ON users.profile_picture_id = profile_pics.id
    LEFT JOIN pictures AS background_pics
      ON users.background_picture_id = background_pics.id
    WHERE users.email = $1
    LIMIT 1
    `,
    [input.email]
  );

  if (foundUser.length === 0) {
    throw new Error(JSON.stringify({ email: "No such user found" }));
  }

  const user = foundUser[0];

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new Error(JSON.stringify({ password: "Password is incorrect" }));
  }

  await createAndSetSession({
    id: user.id,
    email: user.email,
    username: user.username,
  });

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

    const fieldMap: Record<(typeof ALLOWED_SINGLE_FIELDS)[number], string> = {
      id: "id",
      name: "name",
      username: "username",
    };

    const column = fieldMap[field];

    const foundUser = await queryRaw<Record<string, string>>(
      `
      SELECT ${column} AS "${field}"
      FROM users
      WHERE id = $1 OR username = $1
      LIMIT 1
      `,
      [id]
    );

    return foundUser[0];
  }

  const foundUser = await queryRaw<{
    id: string;
    email: string;
    name: string;
    bio: string | null;
    username: string;
    profilePictureUrl: string | null;
    backgroundPictureUrl: string | null;
    location: string | null;
    followerCount: number;
    followingCount: number;
  }>(
    `
    SELECT
      users.id,
      users.email,
      users.name,
      users.bio,
      users.username,
      profile_pics.url AS "profilePictureUrl",
      background_pics.url AS "backgroundPictureUrl",
      users.location,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM follows
          WHERE follows.following_id = users.id
        ),
        0
      ) AS "followerCount",
      COALESCE(
        (
          SELECT COUNT(*)
          FROM follows
          WHERE follows.follower_id = users.id
        ),
        0
      ) AS "followingCount"
    FROM users
    LEFT JOIN pictures AS profile_pics
      ON users.profile_picture_id = profile_pics.id
    LEFT JOIN pictures AS background_pics
      ON users.background_picture_id = background_pics.id
    WHERE users.id = $1 OR users.username = $1
    LIMIT 1
    `,
    [id]
  );

  return foundUser[0];
}

export async function saveUserInfoService(
  userId: string,
  input: SaveUserInputType
) {
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
    const profileId = crypto.randomUUID();
    const [newProfilePictureRow] = await queryRaw<{ insertedId: string }>(
      `
      INSERT INTO pictures (id, type, url, uploaded_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id AS "insertedId"
      `,
      [profileId, "profile_picture", input.profilePictureUrl, userId]
    );

    updateData.profilePictureId = newProfilePictureRow.insertedId;
  }

  if (input.backgroundPictureUrl) {
    const backgroundId = crypto.randomUUID();
    const [newBackgroundPictureRow] = await queryRaw<{ insertedId: string }>(
      `
      INSERT INTO pictures (id, type, url, uploaded_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id AS "insertedId"
      `,
      [backgroundId, "background_picture", input.backgroundPictureUrl, userId]
    );

    updateData.backgroundPictureId = newBackgroundPictureRow.insertedId;
  }

  if (Object.keys(updateData).length === 0) {
    const [existingUser] = await queryRaw<User>(
      `
      SELECT ${USER_RETURNING}
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    return existingUser;
  }

  const setClauses: string[] = [];
  const params: SqlParam[] = [];

  const addParam = (value: ParamType) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (updateData.name !== undefined) {
    setClauses.push(`name = ${addParam(updateData.name)}`);
  }

  if (updateData.bio !== undefined) {
    setClauses.push(`bio = ${addParam(updateData.bio)}`);
  }

  if (updateData.location !== undefined) {
    setClauses.push(`location = ${addParam(updateData.location)}`);
  }

  if (updateData.profilePictureId !== undefined) {
    setClauses.push(
      `profile_picture_id = ${addParam(updateData.profilePictureId)}`
    );
  }

  if (updateData.backgroundPictureId !== undefined) {
    setClauses.push(
      `background_picture_id = ${addParam(updateData.backgroundPictureId)}`
    );
  }

  params.push(userId);
  const whereParam = `$${params.length}`;

  return queryRaw<User>(
    `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = ${whereParam}
    RETURNING ${USER_RETURNING}
    `,
    params
  );
}
