import { z } from "zod";

export const followInput = z.object({
    followerId: z.string().min(1),
    followingId: z.string().min(1)
});

export const userFollowCount = z.object({
    id: z.string().min(1)
})

export type FollowInput = z.infer<typeof followInput>;
export type userFollowCount = z.infer<typeof userFollowCount>;