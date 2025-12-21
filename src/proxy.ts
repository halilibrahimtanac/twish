import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authPages = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const cookieName = "__Secure-authjs.session-token";
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.JWT_SECRET;
  const rawToken = request.cookies.get(cookieName)?.value;

  let sessionToken = null;

  if (secret) {
    try {
      sessionToken = await getToken({
        req: request,
        secret,
        cookieName
      });
    } catch (e) {
      console.error("JWT decode error:", e);
    }
  } else if (rawToken) {
    console.error("JWT decode error: missing auth secret");
  }

  const { pathname } = request.nextUrl;

  const isAuthRoute = authPages.some((route) => pathname.startsWith(route));
  const isAuthenticated = !!sessionToken;

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isAuthRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!sw.js|api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)|uploads/).*)",
  ],
};
