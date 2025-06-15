// /middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the JWT secret retrieval once
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Verifies the JWT token.
 * @param token The JWT string to verify.
 * @returns The payload of the JWT if verification is successful.
 * @throws An error if the token is invalid or verification fails.
 */
async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    // Re-throw the error to be caught by the middleware logic
    throw new Error('Your token has expired or is invalid.');
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path === '/signup';
  const token = request.cookies.get('session-token-twish')?.value;

  if (token) {
    if (isPublicPath) {
      try {
        await verifyJWT(token);
 
        return NextResponse.redirect(new URL('/home', request.url));
      } catch (error) {
        console.error(error);
        const response = NextResponse.next();
        response.cookies.set('session-token-twish', '', { expires: new Date(0) });
        return response;
      }
    }

    try {
      await verifyJWT(token);
    } catch (error) {
      console.error(error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('session-token-twish', '', { expires: new Date(0) });
      return response;
    }
  }

  else {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
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
};