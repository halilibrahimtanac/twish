import db from "@/db";
import { LikeTwishInput, ReTwishInput, TwishInputType } from "./twish.input";
import { likes, twishes, users } from "@/db/schema";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

export async function getFeedTwishes() {
  // 1. CTE for Comment Counts
  /* const commentCounts = db.$with("comment_counts").as(
    db.select({
        originalTwishId: twishes.originalTwishId,
        count: sql<number>`count(${twishes.id})`.as('count')
      })
      .from(twishes)
      // We only count twishes that are 'comments' and have a parent
      .where(and(
        eq(twishes.type, 'comment'),
        isNotNull(twishes.originalTwishId)
      ))
      .groupBy(twishes.originalTwishId)
  ); */

  // 2. CTE for Like Counts
  const likeCounts = db.$with("like_counts").as(
    db
      .select({
        twishId: likes.twishId,
        count: sql<number>`count(${likes.userId})`.as("count"),
        // Aggregate liked user IDs into a single field
        likedByUserIds: sql<string[]>`group_concat(${likes.userId})`.mapWith((csv) => (csv ? csv.split(',').filter(Boolean) : [])).as("liked_by_user_ids"),
      })
      .from(likes)
      .groupBy(likes.twishId)
  );

  // 3. CTE for Retwish Counts and User IDs
  const retwishCounts = db.$with("retwish_counts").as(
    db.select({
        originalTwishId: twishes.originalTwishId,
        count: sql<number>`count(${twishes.id})`.as("count"),
        // Aggregate retweeting user IDs here
        retwishedByUserIds: sql<string[]>`group_concat(${twishes.authorId})`.mapWith((csv) => (csv ? csv.split(',').filter(Boolean) : [])).as("retwished_by_user_ids"),
      })
      .from(twishes)
      // We only count twishes that are 'retwishes' and have a parent
      .where(and(
        eq(twishes.type, 'retwish'),
        isNotNull(twishes.originalTwishId)
      ))
      .groupBy(twishes.originalTwishId)
  );

  // 4. Aliases for joining the original twish and its author
  const originalTwish = alias(twishes, "original_twish");
  const originalAuthor = alias(users, "original_author");

  const posts = await db
    .with(likeCounts, retwishCounts) // Include all CTEs
    .select({
      // Twish data
      id: twishes.id,
      content: twishes.content,
      createdAt: twishes.createdAt,
      type: twishes.type,
      // User data
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatarId: users.profilePictureId,
      // Aggregated data from CTEs
      likes: sql<number>`coalesce((select count from like_counts lkc where lkc.twish_id = ${twishes.id}), 0)`.mapWith(Number),
      likedByUserIds: sql<string[]>`(select liked_by_user_ids from like_counts lkc where lkc.twish_id = ${twishes.id})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      retwishes: sql<number>`coalesce((select count from retwish_counts rtc where rtc.original_twish_id = ${twishes.id}), 0)`.mapWith(Number),
      retwishedByUserIds: sql<string[]>`(select retwished_by_user_ids from retwish_counts rtc where rtc.original_twish_id = ${twishes.id})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),

      // Original twish info (if this is a retwish)
      originalTwish: {
        id: originalTwish.id,
        content: originalTwish.content,
        createdAt: originalTwish.createdAt,
        authorId: originalAuthor.id,
        authorName: originalAuthor.name,
        authorUsername: originalAuthor.username,
        authorAvatarId: originalAuthor.profilePictureId,
      },
    })
    .from(twishes)
    .innerJoin(users, eq(twishes.authorId, users.id))
    // Join for original twish and its author (for retwishes)
    .leftJoin(originalTwish, eq(twishes.originalTwishId, originalTwish.id))
    .leftJoin(originalAuthor, eq(originalTwish.authorId, originalAuthor.id))
    // Filter the main feed to only show original twishes and retwishes (not comments)
    .orderBy(desc(twishes.createdAt))
    .limit(20);

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
