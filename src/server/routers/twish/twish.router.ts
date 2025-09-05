import { protectedProcedure, publicProcedure, router } from "@/server/trpc";
import * as twishService from "./twish.service";
import { deleteTwishInput, getCommentsByTwishId, getFeedTwishesInput, getSingleTwishInput, likeTwishInput, newTwishInput, reTwishInput, updateTwishMediaPreviewInput } from "./twish.input";

export const twishRouter = router({
    getAllTwishes: publicProcedure.input(getFeedTwishesInput).query(({ input }) => twishService.getFeedTwishes(input)),
    newTwish: protectedProcedure.input(newTwishInput).mutation(async ({ ctx, input }) => twishService.newTwishService(ctx.user.id, input)),
    likeTwish: publicProcedure.input(likeTwishInput).mutation(async ({ input }) => twishService.likeTwishService(input)),
    reTwish: publicProcedure.input(reTwishInput).mutation(async ({ input }) => twishService.reTwishService(input)),
    updateTwishMediaPreview: publicProcedure.input(updateTwishMediaPreviewInput).mutation(async ({ input }) => twishService.updateTwishMediaPreviewService(input)),
    getSingleTwish: publicProcedure.input(getSingleTwishInput).query(({ input }) => twishService.getSingleTwish(input.twishId)),
    getCommentsByTwishId: publicProcedure.input(getCommentsByTwishId).query(({ input }) => twishService.getCommentsByTwishId(input)),
    deleteTwish: protectedProcedure.input(deleteTwishInput).mutation(async ({ ctx, input }) => twishService.deleteTwishService(ctx.user.id, input))
})