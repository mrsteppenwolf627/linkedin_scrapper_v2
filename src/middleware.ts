import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    if (
      pathname === '/' ||
      pathname === '/login' ||
      pathname.startsWith('/api/auth')
    ) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      return NextResponse.next()
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
