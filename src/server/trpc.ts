/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initTRPC, TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

interface UserPayload {
  userId: string;
  email: string;
  username: string;
}

export const createContext = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session-token-twish")?.value;

    if (!token) {
      return { user: null };
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }

    const { payload } = await jwtVerify<UserPayload>(token, secret);

    return {
      user: {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
      },
    };
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
