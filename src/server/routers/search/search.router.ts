import { publicProcedure, router } from "@/server/trpc";
import { searchUserInput } from "./search.input";
import { searchUsers } from "./search.service";

export const searchRouter = router({
    searchUser: publicProcedure.input(searchUserInput).query(async ({ input }) => searchUsers(input.query, input.currentUserId))
})