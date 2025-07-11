import db from "@/db";
import { LikeTwishInput, ReTwishInput, TwishInputType } from "./twish.input";
import { likes, pictures, twishes, users } from "@/db/schema";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

function twishDbQuery(){
// 1. CTE for Reply Counts
  /* const replyCounts = db.$with("reply_counts").as(
    db.select({
        parentTwishId: twishes.parentTwishId,
        count: sql<number>`count(${twishes.id})`.as('count')
      })
      .from(twishes)
      // We only count twishes that are 'replies' and have a parent
      .where(and(
        eq(twishes.type, 'reply'),
        isNotNull(twishes.parentTwishId)
      ))
      .groupBy(twishes.parentTwishId)
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
  const mainProfilePictures = alias(pictures, "main_profile_pictures");
  const originalProfilePictures = alias(pictures, "original_profile_pictures");

  return db
    .with(likeCounts, retwishCounts) // Include all CTEs
    .select({
      id: twishes.id,
      content: twishes.content,
      createdAt: twishes.createdAt,
      type: twishes.type,
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatarUrl: mainProfilePictures.url,
      // Aggregated data from CTEs
      likes: sql<number>`coalesce((select count from like_counts lkc where lkc.twish_id = ${twishes.id}), 0)`.mapWith(Number),
      likedByUserIds: sql<string[]>`(select liked_by_user_ids from like_counts lkc where lkc.twish_id = ${twishes.id})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      retwishes: sql<number>`coalesce((select count from retwish_counts rtc where rtc.original_twish_id = ${twishes.id}), 0)`.mapWith(Number),
      retwishedByUserIds: sql<string[]>`(select retwished_by_user_ids from retwish_counts rtc where rtc.original_twish_id = ${twishes.id})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      originalTwish: {
        id: originalTwish.id,
        content: originalTwish.content,
        createdAt: originalTwish.createdAt,
        authorId: originalAuthor.id,
        authorName: originalAuthor.name,
        authorUsername: originalAuthor.username,
        authorAvatarUrl: originalProfilePictures.url,
      },
      originalLikes: sql<number>`coalesce((select count from like_counts lkc where lkc.twish_id = ${twishes.originalTwishId}), 0)`.mapWith(Number),
      originalLikedByUserIds: sql<string[]>`(select liked_by_user_ids from like_counts lkc where lkc.twish_id = ${twishes.originalTwishId})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      originalRetwishes: sql<number>`coalesce((select count from retwish_counts rtc where rtc.original_twish_id = ${twishes.originalTwishId}), 0)`.mapWith(Number),
      originalRetwishedByUserIds: sql<string[]>`(select retwished_by_user_ids from retwish_counts rtc where rtc.original_twish_id = ${twishes.originalTwishId})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),

    })
    .from(twishes)
    .innerJoin(users, eq(twishes.authorId, users.id))
    .leftJoin(originalTwish, eq(twishes.originalTwishId, originalTwish.id))
    .leftJoin(originalAuthor, eq(originalTwish.authorId, originalAuthor.id))
    .leftJoin(mainProfilePictures, eq(mainProfilePictures.id, users.profilePictureId))
    .leftJoin(originalProfilePictures, eq(originalProfilePictures.id, originalAuthor.profilePictureId))
    .orderBy(desc(twishes.createdAt));
}

export async function getFeedTwishes(userId?: string) {
  const feedTwishes = twishDbQuery();
  
    if(userId){
      feedTwishes.where(eq(twishes.authorId, userId));
    }

  return await feedTwishes.limit(20);
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
  const { content, originalTwishId, userId, type } = input;
  
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

  const newTwish = await db
    .insert(twishes)
    .values({
      id: crypto.randomUUID(),
      content,
      authorId: userId,
      originalTwishId,
      type,
  })
    .returning();

  const fullNewTwish = twishDbQuery().where(eq(twishes.id, newTwish[0].id)).limit(1);

  return (await fullNewTwish)[0];
};

export const getSingleTwish = async (twishId: string) => {
  const twishQuery = twishDbQuery();

  twishQuery.where(eq(twishes.id, twishId)).limit(1);

  return (await twishQuery)[0];
}
