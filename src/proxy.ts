import { decode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authPages = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const cookieName = 
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const rawToken = request.cookies.get(cookieName)?.value;
  console.log("ENV: ", process.env.NODE_ENV);
  console.log("COOKIE NAME: ", cookieName);
  console.log("RAW TOKEN: ", rawToken);
  let sessionToken = null;

  if (rawToken) {
    try {
      sessionToken = await decode({
        token: rawToken,
        secret: process.env.NEXTAUTH_SECRET!,
        salt: process.env.NEXTAUTH_SECRET!
      });
    } catch (e) {
      console.error("JWT decode error:", e);
    }
  }

  const { pathname } = request.nextUrl;

  console.log("DECODED TOKEN:", sessionToken);
  console.log("PATH:", pathname);

  const isAuthRoute = authPages.some((route) => pathname.startsWith(route));
  const isAuthenticated = Boolean(sessionToken);

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
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|.*\\.(?:png|jpg|jpeg|gif|svg|webp)|uploads/).*)",
  ],
};
