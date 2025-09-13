import { protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { followerOrFollowingListInput, followInput, userFollowCountInput } from "./follow.input";
import { followService, getFollowerOrFollowingList, getFollowStatusService, getUserFollowingCounts } from "./follow.service";

export const followRouter = router({
    followRoute: protectedProcedure.input(followInput).mutation(async ({ ctx, input }) => followService(input.type, input.followingId, ctx.user.id)),
    getFollowStatus: protectedProcedure.input(followInput).query(async ({ ctx, input }) => getFollowStatusService(input.type, input.followingId, ctx.user.id)),
    userFollowCounts: publicProcedure.input(userFollowCountInput).query(async ({ input }) => getUserFollowingCounts(input.id)),
    getFollowerOrFollowingList: protectedProcedure.input(followerOrFollowingListInput).query(async ({ ctx, input }) => getFollowerOrFollowingList(input, ctx.user.id))
});