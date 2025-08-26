import db from "@/db";
import { FollowInput } from "./follow.input";
import { and, eq } from "drizzle-orm";
import { follows } from "@/db/schema";

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
