import db from "@/db";
import { LikeTwishInput, ReTwishInput, TwishInputType } from "./twish.input";
import { likes, twishes, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function getFeedTwishes() {
  // Aliasing 'twishes' table to use it for the comment count subquery
  /* const comments = db.$with("comments").as(
      db.select({
        originalTwishId: twishes.originalTwishId,
        count: sql<number>`count(${twishes.id})`.as('count')
      }).from(twishes).where(eq(twishes.type, 'comment')).groupBy(twishes.originalTwishId)
    ); */

  const likeCounts = db.$with("like_counts").as(
    db
      .select({
        twishId: likes.twishId,
        count: sql<number>`count(${likes.userId})`.as("count"),
      })
      .from(likes)
      .groupBy(likes.twishId)
  );

  const retwishCount = db.$with("retwish_counts").as(
    db.select({ 
      originalTwishId: twishes.originalTwishId, count: sql<number>`count(${twishes.originalTwishId})`.as("count"), 
    }).from(twishes).groupBy(twishes.originalTwishId)
  )

  const posts = await db
    .with(likeCounts, retwishCount)
    .select({
      // Twish data
      id: twishes.id,
      content: twishes.content,
      createdAt: twishes.createdAt,
      // User data
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatarId: users.profilePictureId,
      authorJoinedDate: users.createdAt,
      likes:
        sql<number>`coalesce((select count from like_counts lkc where lkc.twish_id = ${twishes.id}), 0)`.mapWith(Number),
      likedByUserIds: sql<string[]>`group_concat(distinct ${likes.userId})`.mapWith((csv) =>
        csv
          ? csv.split(',').filter(Boolean)
          : []
        ),
      retwishes: sql<number>`coalesce((select count from retwish_counts rtc where rtc.original_twish_id = ${twishes.id}), 0)`.mapWith(Number)
      // comments: sql<number>`coalesce(${comments.count}, 0)`.mapWith(Number),
    })
    .from(twishes)
    .innerJoin(users, eq(twishes.authorId, users.id))
    .leftJoin(likes, eq(twishes.id, likes.twishId))

    .orderBy(desc(twishes.createdAt))
    .groupBy(twishes.id, users.id)
    .limit(20); // Add pagination

  return posts;
}

export const newTwishService = async (input: TwishInputType) => {
  const { content, username } = input;
  const foundUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));
  if (foundUser[0]) {
    return await db
      .insert(twishes)
      .values({
        id: crypto.randomUUID(),
        content,
        authorId: foundUser[0].id,
      })
      .returning();
  }
  throw new Error("User not found");
};

export const likeTwishService = async (input: LikeTwishInput) => {
  const { twishId, username } = input;
  const foundUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));

  if (foundUser[0]) {
    const existingLike = await db
      .select()
      .from(likes)
      .where(
        sql`${likes.twishId} = ${twishId} AND ${likes.userId} = ${foundUser[0].id}`
      );

    if (existingLike.length > 0) {
      return await db
        .delete(likes)
        .where(
          sql`${likes.twishId} = ${twishId} AND ${likes.userId} = ${foundUser[0].id}`
        )
        .returning();
    } else {
      return await db
        .insert(likes)
        .values({
          twishId,
          userId: foundUser[0].id,
        })
        .returning();
    }
  }
  throw new Error("User not found");
};

export const reTwishService = async (input: ReTwishInput) => {
  const { content, originalTwishId, userId } = input;
  
  // First, verify that the original twish exists
  const originalTwish = await db
    .select()
    .from(twishes)
    .where(eq(twishes.id, originalTwishId))
    .limit(1);

  if (originalTwish.length === 0) {
    throw new Error("Original twish not found");
  }

  // Verify that the user exists
  const foundUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (foundUser.length === 0) {
    throw new Error("User not found");
  }

  // Create the retwish
  return await db
    .insert(twishes)
    .values({
      id: crypto.randomUUID(),
      content,
      authorId: userId,
      originalTwishId,
      type: "retwish",
    })
    .returning();
};
