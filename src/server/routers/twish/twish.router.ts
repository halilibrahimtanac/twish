import { publicProcedure, router } from "@/server/trpc";
import * as twishService from "./twish.service";
import { getCommentsByTwishId, getFeedTwishesInput, getSingleTwishInput, likeTwishInput, newTwishInput, reTwishInput } from "./twish.input";

export const twishRouter = router({
    getAllTwishes: publicProcedure.input(getFeedTwishesInput).query(({ input }) => twishService.getFeedTwishes(input.userId)),
    newTwish: publicProcedure.input(newTwishInput).mutation(async ({ input }) => twishService.newTwishService(input)),
    likeTwish: publicProcedure.input(likeTwishInput).mutation(async ({ input }) => twishService.likeTwishService(input)),
    reTwish: publicProcedure.input(reTwishInput).mutation(async ({ input }) => twishService.reTwishService(input)),
    getSingleTwish: publicProcedure.input(getSingleTwishInput).query(({ input }) => twishService.getSingleTwish(input.twishId)),
    getCommentsByTwishId: publicProcedure.input(getCommentsByTwishId).query(({ input }) => twishService.getCommentsByTwishId(input.twishId))
})