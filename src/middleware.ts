// ============================================
// Auth Middleware
// Protects /app/* (approved users) and /admin/* (approved admins).
// Runs on Edge Runtime; all imports must be Edge-compatible.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SESSION_COOKIE = 'sb-auth-token'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase env vars in middleware')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function redirectToLogin(req: NextRequest, reason?: string): NextResponse {
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = ''

  if (reason) loginUrl.searchParams.set('reason', reason)
  return NextResponse.redirect(loginUrl)
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  try {
    const pathname = req.nextUrl?.pathname ?? ''
    if (!pathname) return NextResponse.next()

    // Defensive bypass for internal runtime routes.
    if (pathname === '/_app' || pathname.startsWith('/_next')) {
      return NextResponse.next()
    }

    const isAdminRoute = pathname.startsWith('/admin')

    // 1) Token presence
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return redirectToLogin(req)

    // 2) Validate JWT with Supabase Auth
    let supabase: ReturnType<typeof getSupabase>
    try {
      supabase = getSupabase()
    } catch {
      console.error('[middleware] Supabase env missing')
      return redirectToLogin(req)
    }

    const authResult = await supabase.auth.getUser(token)
    const authUser = authResult.data?.user ?? null
    if (authResult.error || !authUser) return redirectToLogin(req)

    // 3) Validate app-level status (+ role for admin routes)
    const userResult = await supabase
      .from('users')
      .select('role, status')
      .eq('id', authUser.id)
      .single()

    const user = userResult.data
    if (userResult.error || !user) return redirectToLogin(req)

    if (user.status === 'pending_approval') {
      return redirectToLogin(req, 'pending')
    }
    if (user.status === 'rejected') {
      return redirectToLogin(req, 'rejected')
    }
    if (user.status !== 'approved') {
      return redirectToLogin(req)
    }

    // 4) Admin routes require role='admin'
    if (isAdminRoute && user.role !== 'admin') {
      const homeUrl = req.nextUrl.clone()
      homeUrl.pathname = '/'
      homeUrl.search = ''
      return NextResponse.redirect(homeUrl)
    }

    // 5) Authorized request
    return NextResponse.next()
  } catch (error) {
    console.error('[middleware] Unexpected error:', error)
    return redirectToLogin(req)
  }
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
