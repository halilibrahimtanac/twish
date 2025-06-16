import { router } from "./trpc";
import { userRouter } from "./routers/user/user.router";
import { twishRouter } from "./routers/twish/twish.router";

export const appRouter = router({
  user: userRouter,
  twish: twishRouter
});

export type AppRouter = typeof appRouter;
