import { z } from "zod";

export const searchUserInput = z.object({
    query: z.string(),
    currentUserId: z.string().min(1)
});

export type SearchUserInput = z.infer<typeof searchUserInput>;