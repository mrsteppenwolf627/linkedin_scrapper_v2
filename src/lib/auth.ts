// ============================================
// Auth helpers — session cookies + admin guard
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const SESSION_COOKIE = 'sb-auth-token'

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresIn = 3600
): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null
}

// ── Session verification ──────────────────────────────────────────────────────

export async function getAuthUserId(token: string): Promise<string | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}

// ── Admin guard ───────────────────────────────────────────────────────────────

interface AdminContext {
  adminId: string
  adminEmail: string
}

/**
 * Verifies the request carries a valid session belonging to an approved admin.
 * Returns AdminContext on success, or a NextResponse error to return immediately.
 *
 * Usage:
 *   const admin = await requireAdmin(req)
 *   if (admin instanceof NextResponse) return admin
 *   // admin.adminId is now available
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AdminContext | NextResponse> {
  const token = getTokenFromRequest(req)
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sesión no encontrada. Inicia sesión primero.' },
      { status: 401 }
    )
  }

  const userId = await getAuthUserId(token)
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sesión inválida o expirada.' },
      { status: 401 }
    )
  }

  const supabase = createServerClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Usuario no encontrado.' },
      { status: 401 }
    )
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Acceso restringido a administradores.' },
      { status: 403 }
    )
  }

  if (user.status !== 'approved') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Cuenta de admin no aprobada.' },
      { status: 403 }
    )
  }

  return { adminId: user.id as string, adminEmail: user.email as string }
}
