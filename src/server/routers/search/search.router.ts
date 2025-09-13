import { protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { searchTwishInput, searchUserInput } from "./search.input";
import { searchTwishes, searchUsers } from "./search.service";

export const searchRouter = router({
    searchUser: protectedProcedure.input(searchUserInput).query(async ({ ctx, input }) => searchUsers(input.query, ctx.user.id)),
    searchTwish: publicProcedure.input(searchTwishInput).query(async ({ input}) => searchTwishes(input))
})