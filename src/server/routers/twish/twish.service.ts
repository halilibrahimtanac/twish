import db from "@/db";
import { TwishInputType } from "./twish.input";
import { twishes, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getFeedTwishes() {
    // Aliasing 'twishes' table to use it for the comment count subquery
    /* const comments = db.$with("comments").as(
      db.select({
        originalTwishId: twishes.originalTwishId,
        count: sql<number>`count(${twishes.id})`.as('count')
      }).from(twishes).where(eq(twishes.type, 'comment')).groupBy(twishes.originalTwishId)
    );
    
    const likeCounts = db.$with("like_counts").as(
      db.select({
          twishId: likes.twishId,
          count: sql<number>`count(${likes.userId})`.as('count')
      }).from(likes).groupBy(likes.twishId)
    ); */
  
    const posts = await db
      // .with(comments, likeCounts)
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
        // Aggregated data from subqueries
        // likes: sql<number>`coalesce(${likeCounts.count}, 0)`.mapWith(Number),
        // comments: sql<number>`coalesce(${comments.count}, 0)`.mapWith(Number),
      })
      .from(twishes)
      .innerJoin(users, eq(twishes.authorId, users.id))
      // Filter to only get top-level, original posts
      // .where(eq(twishes.type, "original"))
      // Order by most recent
      .orderBy(desc(twishes.createdAt))
      .limit(20); // Add pagination
  
    return posts;
  }

export const newTwishService = async (input: TwishInputType) => {
    const { content, username } = input;
    const foundUser = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if(foundUser[0]){
        return await db.insert(twishes).values({ 
            id: crypto.randomUUID(),
            content,
            authorId: foundUser[0].id
        }).returning();
    }
    return null;
}