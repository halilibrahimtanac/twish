export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|.*\\.(?:png|jpg|jpeg|gif|svg|webp)|uploads/).*)',
  ],
};