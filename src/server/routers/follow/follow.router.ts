import { publicProcedure, router } from "@/server/trpc";
import { followInput } from "./follow.input";
import { followService, getFollowStatusService } from "./follow.service";

export const followRouter = router({
    followRoute: publicProcedure.input(followInput).mutation(async ({ input }) => followService(input)),
    getFollowStatus: publicProcedure.input(followInput).query(async ({ input }) => getFollowStatusService(input))
})