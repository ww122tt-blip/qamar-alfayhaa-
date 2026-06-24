import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that are publicly accessible (no auth needed)
const PUBLIC_ROUTES = ['/signup', '/client-register', '/client-stats']
const LOGIN_PAGE = '/'
const ADMIN_COOKIE = 'qamar_admin_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. CLIENT PORTAL ROUTES: only allow /client-stats/* and /client-register/* ──
  // These are handled client-side but we ensure no one can bypass to dashboard
  if (
    pathname.startsWith('/client-stats') ||
    pathname.startsWith('/client-register') ||
    pathname.startsWith('/signup')
  ) {
    // These are public/client-only pages, allow through
    return NextResponse.next()
  }

  // ── 2. DASHBOARD ROUTES: require admin session cookie ──
  if (pathname.startsWith('/dashboard')) {
    const adminSession = request.cookies.get(ADMIN_COOKIE)

    if (!adminSession || !adminSession.value) {
      // Redirect to login with return URL
      const loginUrl = new URL(LOGIN_PAGE, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validate session (basic check)
    try {
      const session = JSON.parse(adminSession.value)
      if (!session.authenticated || !session.role) {
        const loginUrl = new URL(LOGIN_PAGE, request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = new URL(LOGIN_PAGE, request.url)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // ── 3. LOGIN PAGE: if already authenticated, redirect to dashboard ──
  if (pathname === '/') {
    const adminSession = request.cookies.get(ADMIN_COOKIE)
    if (adminSession?.value) {
      try {
        const session = JSON.parse(adminSession.value)
        if (session.authenticated && session.role) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch { /* invalid cookie, show login */ }
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to these paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
}
