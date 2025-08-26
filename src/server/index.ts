import { router } from "./trpc";
import { userRouter } from "./routers/user/user.router";
import { twishRouter } from "./routers/twish/twish.router";
import { followRouter } from "./routers/follow/follow.router";

export const appRouter = router({
  user: userRouter,
  twish: twishRouter,
  follows: followRouter
});

export type AppRouter = typeof appRouter;
