import db from "@/db";
import { GetCommentsByTwishIdInput, GetFeedTwishes, LikeTwishInput, ReTwishInput, TwishInputType, UpdateTwishMediaPreviewInput } from "./twish.input";
import { likes, pictures, twishes, users } from "@/db/schema";
import { and, desc, eq, isNotNull, or, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

function twishDbQuery() {

  const replyCounts = db.$with("reply_counts").as(
    db.select({
        originalTwishId: twishes.originalTwishId,
        replyCount: sql<number>`count(${twishes.id})`.as('reply_count')
      })
      .from(twishes)
      .where(and(
        eq(twishes.type, 'comment'),
        isNotNull(twishes.originalTwishId)
      ))
      .groupBy(twishes.originalTwishId)
  );


  const likeCounts = db.$with("like_counts").as(
    db.select({
        twishId: likes.twishId,
        likeCount: sql<number>`count(${likes.userId})`.as("like_count"),
        likedByUserIds: sql<string[]>`group_concat(${likes.userId})`.mapWith((csv) => (csv ? csv.split(',').filter(Boolean) : [])).as("liked_by_user_ids"),
      })
      .from(likes)
      .groupBy(likes.twishId)
  );


  const retwishCounts = db.$with("retwish_counts").as(
    db.select({
        originalTwishId: twishes.originalTwishId,
        retwishCount: sql<number>`count(${twishes.id})`.as("retwish_count"),
        retwishedByUserIds: sql<string[]>`group_concat(${twishes.authorId})`.mapWith((csv) => (csv ? csv.split(',').filter(Boolean) : [])).as("retwished_by_user_ids"),
      })
      .from(twishes)
      .where(and(
        eq(twishes.type, 'retwish'),
        isNotNull(twishes.originalTwishId)
      ))
      .groupBy(twishes.originalTwishId)
  );
  
  const originalTwish = alias(twishes, "original_twish");
  const parentTwish = alias(twishes, "parent_twish");
  const originalAuthor = alias(users, "original_author");
  const parentAuthor = alias(users, "parent_author");
  const mainProfilePictures = alias(pictures, "main_profile_pictures");
  const originalProfilePictures = alias(pictures, "original_profile_pictures");
  const parentProfilePictures = alias(pictures, "parent_profile_pictures");
  const quotedOriginalTwish = alias(twishes, "quoted_original_twish");
  const quotedOriginalAuthor = alias(users, "quoted_original_author");
  const quotedOriginalProfilePictures = alias(pictures, "quoted_original_profile_pictures");

  return db
    .with(likeCounts, retwishCounts, replyCounts)
    .select({
      id: twishes.id,
      content: twishes.content,
      createdAt: twishes.createdAt,
      type: twishes.type,
      authorId: users.id,
      authorName: users.name,
      authorUsername: users.username,
      authorAvatarUrl: mainProfilePictures.url,

      likes: sql<number>`coalesce(${likeCounts.likeCount}, 0)`.mapWith(Number),
      likedByUserIds: likeCounts.likedByUserIds,
      comments: sql<number>`coalesce(${replyCounts.replyCount}, 0)`.mapWith(Number),
      retwishes: sql<number>`coalesce(${retwishCounts.retwishCount}, 0)`.mapWith(Number),
      retwishedByUserIds: retwishCounts.retwishedByUserIds,

      originalTwish: {
        id: originalTwish.id,
        content: originalTwish.content,
        createdAt: originalTwish.createdAt,
        authorId: originalAuthor.id,
        authorName: originalAuthor.name,
        authorUsername: originalAuthor.username,
        authorAvatarUrl: originalProfilePictures.url,
        type: originalTwish.type,
      },
      originalQuotedTwish: {
        id: quotedOriginalTwish.id,
        content: quotedOriginalTwish.content,
        createdAt: quotedOriginalTwish.createdAt,
        authorId: quotedOriginalAuthor.id,
        authorName: quotedOriginalAuthor.name,
        authorUsername: quotedOriginalAuthor.username,
        authorAvatarUrl: quotedOriginalProfilePictures.url,
        mediaPreview: quotedOriginalTwish.mediaPreview
      },
      originalLikes: sql<number>`coalesce((select like_count from like_counts where twish_id = ${twishes.originalTwishId}), 0)`.mapWith(Number),
      originalLikedByUserIds: sql<string[]>`(select liked_by_user_ids from like_counts where twish_id = ${twishes.originalTwishId})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      originalRetwishes: sql<number>`coalesce((select retwish_count from retwish_counts where original_twish_id = ${twishes.originalTwishId}), 0)`.mapWith(Number),
      originalRetwishedByUserIds: sql<string[]>`(select retwished_by_user_ids from retwish_counts where original_twish_id = ${twishes.originalTwishId})`.mapWith((csv) => csv ? csv.split(',').filter(Boolean) : []),
      originalComments: sql<number>`coalesce((select reply_count from reply_counts where original_twish_id = ${twishes.originalTwishId}), 0)`.mapWith(Number),
      
      parentTwishId: twishes.parentTwishId,
      parentTwish: {
        id: parentTwish.id,
        content: parentTwish.content,
        createdAt: parentTwish.createdAt,
        authorId: parentAuthor.id,
        authorName: parentAuthor.name,
        authorUsername: parentAuthor.username,
        authorAvatarUrl: parentProfilePictures.url,
      },
      mediaPreview: twishes.mediaPreview
    })
    .from(twishes)
    .innerJoin(users, eq(twishes.authorId, users.id))
    .leftJoin(likeCounts, eq(likeCounts.twishId, twishes.id))
    .leftJoin(replyCounts, eq(replyCounts.originalTwishId, twishes.id))
    .leftJoin(retwishCounts, eq(retwishCounts.originalTwishId, twishes.id))
    
    .leftJoin(originalTwish, eq(twishes.originalTwishId, originalTwish.id))
    .leftJoin(originalAuthor, eq(originalTwish.authorId, originalAuthor.id))
    .leftJoin(parentTwish, eq(parentTwish.id, twishes.parentTwishId))
    .leftJoin(parentAuthor, eq(parentAuthor.id, parentTwish.authorId))
    .leftJoin(mainProfilePictures, eq(mainProfilePictures.id, users.profilePictureId))
    .leftJoin(originalProfilePictures, eq(originalProfilePictures.id, originalAuthor.profilePictureId))
    .leftJoin(parentProfilePictures, eq(parentProfilePictures.id, parentAuthor.profilePictureId))
    .leftJoin(quotedOriginalTwish, eq(originalTwish.originalTwishId, quotedOriginalTwish.id))
    .leftJoin(quotedOriginalAuthor, eq(quotedOriginalTwish.authorId, quotedOriginalAuthor.id))
    .leftJoin(quotedOriginalProfilePictures, eq(quotedOriginalProfilePictures.id, quotedOriginalAuthor.profilePictureId))
    .orderBy(desc(twishes.createdAt));
}

export async function getFeedTwishes(input: GetFeedTwishes) {
  const { userId, type } = input;
  

  const queryBuilder = twishDbQuery();


  const conditions: SQL[] = [
    or(
      eq(twishes.type, "quote"), 
      eq(twishes.type, "retwish"), 
      eq(twishes.type, "original")
    )!
  ];
  
  if (type === "likes" && userId) {
    queryBuilder.innerJoin(likes, and(
      eq(likes.twishId, twishes.id),
      eq(likes.userId, userId)
    ));
  } else {
    if (userId) {
      conditions.push(eq(twishes.authorId, userId));
    }
    if (type === "media") {
      conditions.push(eq(twishes.hasMedia, true));
    }
  }

  if(conditions.length > 0) {
      queryBuilder.where(and(...conditions));
  }

  const result = await queryBuilder.limit(20);


  return result.map(tw => ({
    ...tw,
    likedByUserIds: tw.likedByUserIds || [],
    retwishedByUserIds: tw.retwishedByUserIds || [],
    originalLikedByUserIds: tw.originalLikedByUserIds || [],
    originalRetwishedByUserIds: tw.originalRetwishedByUserIds || [],
    originalQuotedTwish:
    { ...tw.originalQuotedTwish, 
      mediaPreview: tw.originalQuotedTwish.mediaPreview ? 
      JSON.parse(tw.originalQuotedTwish.mediaPreview) : null 
    },
    mediaPreview: tw.mediaPreview ? JSON.parse(tw.mediaPreview) : null
  }));
}

export const newTwishService = async (userId: string, input: TwishInputType) => {
  const { content, hasMedia, mediaCount } = input;

  return (
    await db
      .insert(twishes)
      .values({
        id: crypto.randomUUID(),
        content,
        authorId: userId,
        hasMedia,
        mediaCount,
      })
      .returning()
  )[0];
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
  const { content, originalTwishId, parentTwishId, userId, type } = input;
  
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
      parentTwishId,
      type,
  })
    .returning();

  const fullNewTwish = twishDbQuery().where(eq(twishes.id, newTwish[0].id)).limit(1);

  return (await fullNewTwish)[0];
};

export const updateTwishMediaPreviewService = async (input: UpdateTwishMediaPreviewInput) => {
  const { id, mediaPreview } = input;

  await db.update(twishes).set({ mediaPreview }).where(eq(twishes.id, id));

  return true;
}

export const getSingleTwish = async (twishId: string) => {
  const twishQuery = twishDbQuery();

  twishQuery.where(eq(twishes.id, twishId)).limit(1);
  const [result] = (await twishQuery);

  return { ...result,
    originalQuotedTwish:
    { ...result.originalQuotedTwish, 
      mediaPreview: result.originalQuotedTwish.mediaPreview ? 
      JSON.parse(result.originalQuotedTwish.mediaPreview) : null 
    },
     mediaPreview: result.mediaPreview ? JSON.parse(result.mediaPreview) : null};
};

export const getCommentsByTwishId = async ({ type, twishId }: GetCommentsByTwishIdInput) => {
  const twishQuery = twishDbQuery();

  const equalQuery = type === "comment" ? eq(twishes.parentTwishId, twishId) : eq(twishes.originalTwishId, twishId)

  const result = await twishQuery.where(and(equalQuery, eq(twishes.type, 'comment')));

  return result.map(cm => ({
    ...cm,
    originalQuotedTwish:
    { ...cm.originalQuotedTwish, 
      mediaPreview: cm.originalQuotedTwish.mediaPreview ? 
      JSON.parse(cm.originalQuotedTwish.mediaPreview) : null 
    },
    mediaPreview: cm.mediaPreview ? JSON.parse(cm.mediaPreview) : null
  }));
};

export const deleteTwishService = async (userId: string, input: { id: string }) => {
  const { id } = input;

  const existingTwish = await db
    .select()
    .from(twishes)
    .where(and(eq(twishes.id, id), eq(twishes.authorId, userId)))
    .limit(1);

  if (existingTwish.length === 0) {
    throw new Error("Twish not found");
  }

  await db
    .delete(twishes)
    .where(eq(twishes.id, id))
    .returning();

  return { success: true };
};


