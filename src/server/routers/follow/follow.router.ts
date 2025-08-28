import { publicProcedure, router } from "@/server/trpc";
import { followerOrFollowingListInput, followInput, userFollowCountInput } from "./follow.input";
import { followService, getFollowerOrFollowingList, getFollowStatusService, getUserFollowingCounts } from "./follow.service";

export const followRouter = router({
    followRoute: publicProcedure.input(followInput).mutation(async ({ input }) => followService(input)),
    getFollowStatus: publicProcedure.input(followInput).query(async ({ input }) => getFollowStatusService(input)),
    userFollowCounts: publicProcedure.input(userFollowCountInput).query(async ({ input }) => getUserFollowingCounts(input.id)),
    getFollowerOrFollowingList: publicProcedure.input(followerOrFollowingListInput).query(async ({ input }) => getFollowerOrFollowingList(input))
});