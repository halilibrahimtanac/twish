import db from "@/db";
import { FollowerOrFollowingList, FollowInput } from "./follow.input";
import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { follows, pictures, users } from "@/db/schema";
import { alias } from "drizzle-orm/sqlite-core";
import { TRPCError } from "@trpc/server";

export const followService = async (input: FollowInput) => {
  let followerId: string;
  let followingId: string;

  if (input.type === "id") {
    followerId = input.followerId;
    followingId = input.followingId;
  }
  else {
    const { followerId: followerIdInput, followingId: followingIdInput } = input;

    const userResults = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.username, [followerIdInput, followingIdInput]));

    const follower = userResults.find((u) => u.username === followerIdInput);
    const following = userResults.find((u) => u.username === followingIdInput);

    if (!follower || !following) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Takip işlemi için bir veya daha fazla kullanıcı bulunamadı.",
      });
    }

    followerId = follower.id;
    followingId = following.id;
  }

  if (followerId === followingId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Kullanıcılar kendilerini takip edemez.",
    });
  }

  const newFollow = await db
    .insert(follows)
    .values({ followerId, followingId })
    .onConflictDoNothing()
    .returning();

  if (newFollow.length > 0) {
    return { action: "followed", status: "success", data: newFollow[0] };
  }


  await db
    .delete(follows)
    .where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );

  return { action: "unfollowed", status: "success" };
};

export const getFollowStatusService = async (input: FollowInput) => {
  let followerId: string;
  let followingId: string;

  if (input.type === "id") {
    followerId = input.followerId;
    followingId = input.followingId;
  } else {
    const { followerId: followerIdInput, followingId: followingIdInput } = input;

    if (followerIdInput === followingIdInput) {
        return { isFollowing: false, isCurrentUser: true };
    }

    const userResults = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.username, [followerIdInput, followingIdInput]));

    const follower = userResults.find((u) => u.username === followerIdInput);
    const following = userResults.find((u) => u.username === followingIdInput);

    if (!follower || !following) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Durum kontrolü için bir veya daha fazla kullanıcı bulunamadı.",
      });
    }

    followerId = follower.id;
    followingId = following.id;
  }

  if (followerId === followingId) {
    return { isFollowing: false, isCurrentUser: true };
  }


  const followRecord = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    )
    .limit(1);

  return { isFollowing: followRecord.length > 0, isCurrentUser: false };
};

export const getUserFollowingCounts = async (id: string) => {
  const result = await db
    .select({
      followerCount: sql<number>`COALESCE((
        SELECT COUNT(*) 
        FROM ${follows} 
        WHERE ${follows.followingId} = ${users.id}
      ), 0)`,
      followingCount: sql<number>`COALESCE((
        SELECT COUNT(*) 
        FROM ${follows} 
        WHERE ${follows.followerId} = ${users.id}
      ), 0)`
    })
    .from(users)
    .where(or(eq(users.id, id), eq(users.username, id)))
    .limit(1);

  return result[0] || { followerCount: 0, followingCount: 0 };
};

export const getFollowerOrFollowingList = async (
  input: FollowerOrFollowingList
) => {
  const profilePics = alias(pictures, "profile_pics");
  const followCheck = alias(follows, "follow_check");

  const { id, type, userId } = input;

  const followerList = db.$with("follower_list").as(
    db
      .select({
        userId: follows.followerId,
      })
      .from(follows)
      .where(eq(follows.followingId, id))
  );

  const followingList = db.$with("following_list").as(
    db
      .select({
        userId: follows.followingId,
      })
      .from(follows)
      .where(eq(follows.followerId, id))
  );

  const targetList = type === "follower" ? followerList : followingList;

  const list = await db
    .with(targetList)
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profilePictureUrl: profilePics.url,
      isFollowing: isNotNull(followCheck.followerId),
    })
    .from(targetList)
    .innerJoin(users, eq(targetList.userId, users.id))
    .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id))
    .leftJoin(
      followCheck,
      and(
        eq(followCheck.followerId, userId),
        eq(followCheck.followingId, users.id)
      )
    );

  return list || [];
};