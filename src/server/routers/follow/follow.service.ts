import db from "@/db";
import { FollowerOrFollowingList, FollowInput } from "./follow.input";
import { and, eq, or, sql } from "drizzle-orm";
import { follows, pictures, users } from "@/db/schema";
import { alias } from "drizzle-orm/sqlite-core";

export const followService = async (input: FollowInput) => {
  const { followerId, followingId } = input;

  if (followerId === followingId) {
    throw new Error("Kullanıcılar kendilerini takip edemez.");
  }

  const newFollow = await db
    .insert(follows)
    .values({ followerId, followingId })
    .onConflictDoNothing()
    .returning();

  if (newFollow.length > 0) {
    return { action: "followed", status: "success", data: newFollow[0] };
  }

  await db.delete(follows).where(
    and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
  );

  return { action: "unfollowed", status: "success" };
};



export const getFollowStatusService = async (input: FollowInput) => {
  const { followerId, followingId } = input;

  if (followerId === followingId) {
    return { isFollowing: false, isCurrentUser: true };
  }

  const isFollowing = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      )
    )

  return { isFollowing: isFollowing[0], isCurrentUser: false };
};

export const getUserFollowingCounts = async (id: string) => {
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
      followerCount: sql<number>`COALESCE(${followerCounts.followerCount}, 0)`,
      followingCount: sql<number>`COALESCE(${followingCounts.followingCount}, 0)`
    })
    .from(users)
    .leftJoin(followerCounts, eq(followerCounts.followingId, users.id))
    .leftJoin(followingCounts, eq(followingCounts.followerId, users.id))
    .where(or(eq(users.id, id), eq(users.username, id)))
    .limit(1);

  return foundUser[0];
}

export const getFollowerOrFollowingList = async (
  input: FollowerOrFollowingList
) => {
  const profilePics = alias(pictures, "profile_pics");
  const { id, type } = input;

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
      name: users.name,
      username: users.username,
      profilePictureUrl: profilePics.url,
    })
    .from(targetList)
    .innerJoin(users, eq(targetList.userId, users.id))
    .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id));

  return list || [];
};
