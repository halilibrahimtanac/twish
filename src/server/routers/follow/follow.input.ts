import { z } from "zod";

export const followInput = z.object({
    followerId: z.string().min(1),
    followingId: z.string().min(1)
});

export const userFollowCountInput = z.object({
    id: z.string().min(1)
});

export const followerOrFollowingListInput = z.object({
    id: z.string().min(1),
    type: z.enum(["follower", "following"])
})

export type FollowInput = z.infer<typeof followInput>;
export type UserFollowCount = z.infer<typeof userFollowCountInput>;
export type FollowerOrFollowingList = z.infer<typeof followerOrFollowingListInput>;