import { publicProcedure, router } from "@/server/trpc";
import { followInput, userFollowCount } from "./follow.input";
import { followService, getFollowStatusService, getUserFollowingCounts } from "./follow.service";

export const followRouter = router({
    followRoute: publicProcedure.input(followInput).mutation(async ({ input }) => followService(input)),
    getFollowStatus: publicProcedure.input(followInput).query(async ({ input }) => getFollowStatusService(input)),
    userFollowCounts: publicProcedure.input(userFollowCount).query(async ({ input }) => getUserFollowingCounts(input.id))
});