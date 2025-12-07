/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/authOptions";
import { initTRPC, TRPCError } from "@trpc/server";
import getServerSession from "next-auth";

export const createContext = async () => {
  try {
    const sessionAuth = getServerSession(authOptions);
    const session = await sessionAuth.auth();

    if (!session) {
      return { user: null };
    }

    return {
      user: session.user
    }
  } catch (error: any) {
    return { user: null };
  }
};

const t = initTRPC.context<typeof createContext>().create();

const isAuth = t.middleware(({ ctx, next }) => {

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuth);
