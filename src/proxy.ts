// src/proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// In Next.js 16+, the function must be named 'proxy' or be the default export
export async function proxy(request: NextRequest) {
  // Skip all API routes completely
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup')

  // If not authenticated and trying to access chat routes
  if (!token && !isAuthPage && request.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated and trying to access auth pages (login/signup)
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

// In Next.js 16+, the config is still supported
export const config = {
  matcher: [
    '/chat/:path*', 
    '/login', 
    '/signup',
    // Include API routes so we can skip them
    '/api/:path*',
  ],
}