import { z } from "zod";

export const getFeedTwishesInput = z.object({
    userId: z.string().optional()
})

export const newTwishInput = z.object({
    content: z.string().min(1),
    username: z.string().min(1),
    hasMedia: z.boolean(),
    mediaCount: z.number()
});

export const likeTwishInput = z.object({
    username: z.string().min(1),
    twishId: z.string().min(1)
});

export const reTwishInput = z.object({
    content: z.string(),
    originalTwishId: z.string().min(1),
    userId: z.string().min(1),
    parentTwishId: z.string().optional(),
    type: z.string().default("original"),
    hasMedia: z.boolean(),
    mediaCount: z.number()
});

export const updateTwishMediaPreviewInput = z.object({
    id: z.string().min(1),
    mediaPreview: z.string().min(1)
});

export const getSingleTwishInput = z.object({
    twishId: z.string().min(1)
});

export const getCommentsByTwishId = z.object({
    type: z.string(),
    twishId: z.string().min(1)
});

export const deleteTwishInput = z.object({
    id: z.string().min(1)
});

export type GetFeedTwishes = z.infer<typeof getFeedTwishesInput>;
export type TwishInputType = z.infer<typeof newTwishInput>;
export type LikeTwishInput = z.infer<typeof likeTwishInput>;
export type ReTwishInput = z.infer<typeof reTwishInput>;
export type UpdateTwishMediaPreviewInput = z.infer<typeof updateTwishMediaPreviewInput>;
export type GetSingleTwishInput = z.infer<typeof getSingleTwishInput>;
export type GetCommentsByTwishIdInput = z.infer<typeof getCommentsByTwishId>;
export type DeleteTwishInput = z.infer<typeof deleteTwishInput>;