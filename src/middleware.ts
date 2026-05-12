// ============================================
// Auth Middleware
// Protects /app/* (approved users) and /admin/* (approved admins).
// Runs on Edge Runtime — all imports must be Edge-compatible.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SESSION_COOKIE = 'sb-auth-token'

// Instantiate Supabase directly — avoids importing @/lib/supabase which may
// carry transitive Node.js deps that break Edge Runtime bundling.
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars in middleware')
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
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')

  // ── 1. Token presence ───────────────────────────────────────────────────────
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return redirectToLogin(req)

  // ── 2. Verify JWT via Supabase Auth ─────────────────────────────────────────
  let supabase: ReturnType<typeof getSupabase>
  try {
    supabase = getSupabase()
  } catch {
    // Misconfigured env — fail open for now, log for ops
    console.error('[middleware] Supabase env missing')
    return redirectToLogin(req)
  }

  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !authUser) return redirectToLogin(req)

  // ── 3. Check status (and role for /admin/*) from custom users table ─────────
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', authUser.id)
    .single()

  if (userErr || !user) return redirectToLogin(req)

  if (user.status === 'pending_approval') {
    return redirectToLogin(req, 'pending')
  }
  if (user.status === 'rejected') {
    return redirectToLogin(req, 'rejected')
  }
  if (user.status !== 'approved') {
    return redirectToLogin(req)
  }

  // ── 4. Admin routes require role='admin' ────────────────────────────────────
  if (isAdminRoute && user.role !== 'admin') {
    const homeUrl = req.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  // ── 5. Authenticated + authorized — forward the request ─────────────────────
  return NextResponse.next()
}

// Middleware only runs for these paths — public routes never reach this code.
// /api/admin/* is intentionally excluded: those endpoints have their own
// requireAdmin() guard and don't need a middleware redirect.
export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
