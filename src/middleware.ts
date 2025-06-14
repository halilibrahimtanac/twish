/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path === '/signup';

  // 1. Get the token from the user's cookies
  const token = request.cookies.get('session-token-twish')?.value || '';

  console.log(token, request.cookies.get('session-token-twish')?.value)

  // 2. If the user is on a public path and has a token, redirect to dashboard
  if (isPublicPath && token) {
    try {
      // Validate the token to ensure it's not a leftover invalid token
      await verifyJWT(token);
      // If token is valid, redirect to the dashboard
      return NextResponse.redirect(new URL('/home', request.nextUrl));
    } catch (error) {
      // If token is invalid, let them stay on the public page
      return NextResponse.next();
    }
  }

  // 3. If the user is on a protected path and does NOT have a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // 4. If the user has a token and is on a protected path, verify it
  if (!isPublicPath && token) {
    try {
      // Validate the token
      await verifyJWT(token);
    } catch (error) {
      // If token verification fails, redirect to login and clear the invalid cookie
      console.error('JWT Verification Error:', error);
      const response = NextResponse.redirect(new URL('/login', request.nextUrl));
      response.cookies.set('session-token-twish', '', { expires: new Date(0) });
      return response;
    }
  }
  
  // 5. If all checks pass, allow the request to proceed
  return NextResponse.next();
}

/**
 * A helper function to verify the JWT using 'jose'.
 * @param token The JWT string to verify.
 * @returns The payload of the JWT if verification is successful.
 * @throws An error if the token is invalid or verification fails.
 */
async function verifyJWT(token: string) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
}


// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}