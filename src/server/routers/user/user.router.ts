import { publicProcedure, router } from '@/server/trpc';
import { addUserInput, loginInput, getUserProfileInfosInput, saveUserInfoInput } from './user.input';
import * as userService from './user.service';

export const userRouter = router({
  getUsers: publicProcedure.query(userService.getAllUsers),

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
  
  logout: publicProcedure.mutation(userService.logoutUser),

  getUserProfileInfos: publicProcedure
    .input(getUserProfileInfosInput)
    .query(({ input }) => userService.getUserProfileInfos(input.id)),
  
  updateUserInfo: publicProcedure.input(saveUserInfoInput).mutation(async ({ input }) => userService.saveUserInfoService(input))
});