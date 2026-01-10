import { FollowerOrFollowingList } from "./follow.input";
import { TRPCError } from "@trpc/server";
import { queryRaw } from "@/db/neon";

const resolveFollowIds = async (
  typeParam: string,
  followingIdParam: string,
  followerIdParam: string
) => {
  if (typeParam === "id") {
    return {
      followerId: followerIdParam,
      followingId: followingIdParam,
    };
  }

  const userResults = await queryRaw<{ id: string; username: string }>(
    `
    SELECT id, username
    FROM users
    WHERE username IN ($1, $2)
    `,
    [followerIdParam, followingIdParam]
  );

  const follower = userResults.find((u) => u.username === followerIdParam);
  const following = userResults.find((u) => u.username === followingIdParam);

  if (!follower || !following) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Takip islemi icin bir veya daha fazla kullanici bulunamadi.",
    });
  }

  return { followerId: follower.id, followingId: following.id };
};

const hasFollow = async (followerId: string, followingId: string) => {
  const result = await queryRaw<{ found: number }>(
    `
    SELECT 1 AS found
    FROM follows
    WHERE follower_id = $1
      AND following_id = $2
    LIMIT 1
    `,
    [followerId, followingId]
  );

  return result.length > 0;
};

export const followService = async (
  typeParam: string,
  followingIdParam: string,
  followerIdParam: string
) => {
  const { followerId, followingId } = await resolveFollowIds(
    typeParam,
    followingIdParam,
    followerIdParam
  );

  if (followerId === followingId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Kullanicilar kendilerini takip edemez.",
    });
  }

  const newFollow = await queryRaw<{
    follower_id: string;
    following_id: string;
    created_at: string;
  }>(
    `
    INSERT INTO follows (follower_id, following_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
    `,
    [followerId, followingId]
  );

  if (newFollow.length > 0) {
    return { action: "followed", status: "success", data: newFollow[0] };
  }

  await queryRaw(
    `
    DELETE FROM follows
    WHERE follower_id = $1
      AND following_id = $2
    `,
    [followerId, followingId]
  );

  return { action: "unfollowed", status: "success" };
};

export const getFollowStatusService = async (
  typeParam: string,
  followingIdParam: string,
  followerIdParam: string
) => {
  if (typeParam === "id") {
    if (followerIdParam === followingIdParam) {
      return { isFollowing: false, isCurrentUser: true };
    }

    const isFollowing = await hasFollow(followerIdParam, followingIdParam);
    return { isFollowing, isCurrentUser: false };
  }

  if (followerIdParam === followingIdParam) {
    return { isFollowing: false, isCurrentUser: true };
  }

  const userResults = await queryRaw<{ id: string; username: string }>(
    `
    SELECT id, username
    FROM users
    WHERE username IN ($1, $2)
    `,
    [followerIdParam, followingIdParam]
  );

  const follower = userResults.find((u) => u.username === followerIdParam);
  const following = userResults.find((u) => u.username === followingIdParam);

  if (!follower || !following) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Durum kontrolu icin bir veya daha fazla kullanici bulunamadi.",
    });
  }

  if (follower.id === following.id) {
    return { isFollowing: false, isCurrentUser: true };
  }

  const isFollowing = await hasFollow(follower.id, following.id);
  return { isFollowing, isCurrentUser: false };
};

export const getUserFollowingCounts = async (id: string) => {
  const result = await queryRaw<{
    followerCount: number;
    followingCount: number;
  }>(
    `
  SELECT
    COALESCE((
      SELECT COUNT(*)
      FROM follows
      WHERE follows.following_id = users.id
    ), 0) AS "followerCount",
    COALESCE((
      SELECT COUNT(*)
      FROM follows
      WHERE follows.follower_id = users.id
    ), 0) AS "followingCount"
  FROM users
  WHERE users.id = $1
     OR users.username = $1
  LIMIT 1
  `,
    [id]
  );

  return result[0] ?? { followerCount: 0, followingCount: 0 };
};

export const getFollowerOrFollowingList = async (
  input: FollowerOrFollowingList,
  userId: string
) => {
  const { id, type } = input;

  const listQuery =
    type === "follower"
      ? `
        WITH target_list AS (
          SELECT follower_id AS user_id
          FROM follows
          WHERE following_id = $1
        )
        SELECT
          users.id,
          users.name,
          users.username,
          profile_pics.url AS "profilePictureUrl",
          (follow_check.follower_id IS NOT NULL) AS "isFollowing"
        FROM target_list
        JOIN users ON target_list.user_id = users.id
        LEFT JOIN pictures AS profile_pics
          ON users.profile_picture_id = profile_pics.id
        LEFT JOIN follows AS follow_check
          ON follow_check.follower_id = $2
         AND follow_check.following_id = users.id
        `
      : `
        WITH target_list AS (
          SELECT following_id AS user_id
          FROM follows
          WHERE follower_id = $1
        )
        SELECT
          users.id,
          users.name,
          users.username,
          profile_pics.url AS "profilePictureUrl",
          (follow_check.follower_id IS NOT NULL) AS "isFollowing"
        FROM target_list
        JOIN users ON target_list.user_id = users.id
        LEFT JOIN pictures AS profile_pics
          ON users.profile_picture_id = profile_pics.id
        LEFT JOIN follows AS follow_check
          ON follow_check.follower_id = $2
         AND follow_check.following_id = users.id
        `;

  const list = await queryRaw<{
    id: string;
    name: string;
    username: string;
    profilePictureUrl: string | null;
    isFollowing: boolean;
  }>(listQuery, [id, userId]);

  return list ?? [];
};