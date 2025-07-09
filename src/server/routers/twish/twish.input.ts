import { z } from "zod";

export const getFeedTwishesInput = z.object({
    userId: z.string().optional()
})

export const newTwishInput = z.object({
    content: z.string().min(1),
    username: z.string().min(1)
});

export const likeTwishInput = z.object({
    username: z.string().min(1),
    twishId: z.string().min(1)
});

export const reTwishInput = z.object({
    content: z.string().min(1),
    originalTwishId: z.string().min(1),
    userId: z.string().min(1),
    type: z.string().default("original")
});

export const getSingleTwishInput = z.object({
    twishId: z.string().min(1)
})

export type GetFeedTwishes = z.infer<typeof getFeedTwishesInput>;
export type TwishInputType = z.infer<typeof newTwishInput>;
export type LikeTwishInput = z.infer<typeof likeTwishInput>;
export type ReTwishInput = z.infer<typeof reTwishInput>;
export type GetSingleTwishInput = z.infer<typeof getSingleTwishInput>;