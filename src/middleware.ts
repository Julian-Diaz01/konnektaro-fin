import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'auth-token'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/portfolio', '/stocks']

// Routes that should redirect to dashboard if user is already authenticated
const authRoutes = ['/login', '/register', '/']

function isProtectedRoute (pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isAuthRoute (pathname: string): boolean {
  return authRoutes.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
}

export function middleware (request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isAuthenticated = !!authToken

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute(pathname) && isAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
    const redirectUrl = callbackUrl && callbackUrl.startsWith('/') 
      ? callbackUrl 
      : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'
  ]
}

