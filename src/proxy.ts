import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authPages = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  console.log("NEXT AUTH SECRET: ", process.env.NEXTAUTH_SECRET);
  const sessionToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;
  console.log("SESSION TOKEN: ", sessionToken);
  console.log("PATH NAME: ", pathname);

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
