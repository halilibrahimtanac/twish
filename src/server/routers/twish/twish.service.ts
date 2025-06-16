import db from "@/db";
import { TwishInputType } from "./twish.input";
import { twishes, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getAllTwishesService = async () => {
    return await db.select().from(twishes);
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