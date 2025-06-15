import { router } from "./trpc";
import { userRouter } from "./routers/user/user.router";

export const appRouter = router({
  user: userRouter
});

export type AppRouter = typeof appRouter;
