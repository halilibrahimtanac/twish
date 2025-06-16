import { publicProcedure, router } from "@/server/trpc";
import * as twishService from "./twish.service";
import { likeTwishInput, newTwishInput } from "./twish.input";

export const twishRouter = router({
    getAllTwishes: publicProcedure.query(twishService.getFeedTwishes),
    newTwish: publicProcedure.input(newTwishInput).mutation(async ({ input }) => twishService.newTwishService(input)),
    likeTwish: publicProcedure.input(likeTwishInput).mutation(async ({ input }) => twishService.likeTwishService(input))
})