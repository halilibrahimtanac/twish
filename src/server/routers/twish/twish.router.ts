import { publicProcedure, router } from "@/server/trpc";
import * as twishService from "./twish.service";
import { newTwishInput } from "./twish.input";

export const twishRouter = router({
    getAllTwishes: publicProcedure.query(twishService.getAllTwishesService),
    newTwish: publicProcedure.input(newTwishInput).mutation(async ({ input }) => twishService.newTwishService(input))
})