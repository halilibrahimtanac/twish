import db from "@/db";
import { follows, pictures, users } from "@/db/schema";
import { and, eq, like, not, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { SearchTwishInput } from "./search.input";
import { twishes } from "@/db/schema";
import { twishDbQuery } from "../twish/twish.service";

export async function searchUsers(query: string, currentUserId: string) {
  if (query.trim().length < 2) {
    return [];
  }

  const profilePics = alias(pictures, "profile_pics");

  const lowerCaseQuery = query.toLowerCase();
  const startsWithQuery = `${lowerCaseQuery}%`;
  const containsQuery = `%${lowerCaseQuery}%`;

  const relevanceScore = sql<number>`
      CASE
        WHEN lower(${users.username}) = ${lowerCaseQuery} THEN 5
        WHEN lower(${users.name}) = ${lowerCaseQuery} THEN 4
        WHEN lower(${users.username}) LIKE ${startsWithQuery} THEN 3
        WHEN lower(${users.name}) LIKE ${startsWithQuery} THEN 2
        WHEN lower(${users.username}) LIKE ${containsQuery} OR lower(${users.name}) LIKE ${containsQuery} THEN 1
        ELSE 0
      END
    `.as("relevanceScore");

  const foundUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      profilePictureUrl: profilePics.url,
      isFollowing:
        sql<boolean>`case when ${follows.followerId} is not null then 1 else 0 end`.as(
          "isFollowing"
        ),
      relevanceScore: relevanceScore,
    })
    .from(users)
    .leftJoin(profilePics, eq(users.profilePictureId, profilePics.id))
    .leftJoin(
      follows,
      and(
        eq(follows.followingId, users.id),
        eq(follows.followerId, currentUserId)
      )
    )
    .where(
      and(
        not(eq(users.id, currentUserId)),
        or(
          like(sql`lower(${users.name})`, containsQuery),
          like(sql`lower(${users.username})`, containsQuery)
        )
      )
    )
    .orderBy(sql`${relevanceScore} DESC, ${users.name} ASC`)
    .limit(20);

  return foundUsers;
}

export async function searchTwishes(input: SearchTwishInput){
  const { query, type } = input;

  if (query.trim().length < 2) {
    return [];
  }

  const queryBuilder = twishDbQuery();
  
  const lowerCaseQuery = query.toLowerCase();
  const containsQuery = `%${lowerCaseQuery}%`;
  
  const baseConditions = [
    or(
      eq(twishes.type, "quote"), 
      eq(twishes.type, "retwish"), 
      eq(twishes.type, "original")
    )!
  ];

  let searchCondition;
  
  if (type === "tag") {
    const hashtagQuery = `%#${lowerCaseQuery}%`;
    searchCondition = like(sql`lower(${twishes.content})`, hashtagQuery);
  } else {
    searchCondition = like(sql`lower(${twishes.content})`, containsQuery);
  }

  const result = await queryBuilder
    .where(and(...baseConditions, searchCondition))
    .limit(20);

  return result.map(tw => ({
    ...tw,
    likedByUserIds: tw.likedByUserIds || [],
    retwishedByUserIds: tw.retwishedByUserIds || [],
    originalLikedByUserIds: tw.originalLikedByUserIds || [],
    originalRetwishedByUserIds: tw.originalRetwishedByUserIds || [],
    originalQuotedTwish: {
      ...tw.originalQuotedTwish, 
      mediaPreview: tw.originalQuotedTwish.mediaPreview ? 
        JSON.parse(tw.originalQuotedTwish.mediaPreview) : null 
    },
    mediaPreview: tw.mediaPreview ? JSON.parse(tw.mediaPreview) : null
  }));
}
