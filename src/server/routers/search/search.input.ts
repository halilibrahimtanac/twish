import { z } from "zod";

export const searchUserInput = z.object({
    query: z.string()
});

export const searchTwishInput = z.object({
    query: z.string(),
    type: z.enum(["tag", "word"])
});

export type SearchUserInput = z.infer<typeof searchUserInput>;
export type SearchTwishInput = z.infer<typeof searchTwishInput>;