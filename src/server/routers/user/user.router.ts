// src/server/api/routers/user/user.router.ts
import { publicProcedure, router } from '@/server/trpc';
import { addUserInput, loginInput } from './user.input';
import * as userService from './user.service';

export const userRouter = router({
  getUsers: publicProcedure.query(() => {
    return userService.getAllUsers();
  }),

  addUser: publicProcedure
    .input(addUserInput)
    .mutation(({ input }) => {
      return userService.createUser(input);
  }),
  
  login: publicProcedure
    .input(loginInput)
    .mutation(async ({ input }) => {
      return userService.loginUser(input);
  }),
});