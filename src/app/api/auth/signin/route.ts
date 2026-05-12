// ============================================
// POST /api/auth/signin
// Authenticates a user and sets an HttpOnly session cookie.
// Rejects if status != 'approved'.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { setSessionCookie } from '@/lib/auth'
import type { ApiError } from '@/types'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Body JSON inválido' },
      { status: 400 }
    )
  }

  const email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Email y contraseña son requeridos.' },
      { status: 400 }
    )
  }

  // ── Call Supabase Auth REST directly (works with service role key) ──────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  let authResponse: Response
  try {
    authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
      },
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    console.error('[signin] Auth fetch error:', err)
    return NextResponse.json<ApiError>(
      { error: 'Internal Server Error', message: 'Error de conexión al servidor de autenticación.' },
      { status: 500 }
    )
  }

  if (!authResponse.ok) {
    // Supabase returns 400 for invalid credentials — generic message prevents enumeration
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Email o contraseña incorrectos.' },
      { status: 401 }
    )
  }

  const session = await authResponse.json() as {
    access_token: string
    expires_in: number
    user: { id: string }
  }

  // ── Check approval status in custom users table ────────────────────────────
  const supabase = createServerClient()
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', session.user.id)
    .single()

  if (userErr || !user) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Cuenta no encontrada.' },
      { status: 401 }
    )
  }

  if (user.status === 'pending_approval') {
    return NextResponse.json<ApiError>(
      { error: 'Forbidden', message: 'Tu cuenta está pendiente de aprobación. Contacta con el administrador.' },
      { status: 403 }
    )
  }

  if (user.status === 'rejected') {
    return NextResponse.json<ApiError>(
      { error: 'Forbidden', message: 'Tu cuenta ha sido rechazada.' },
      { status: 403 }
    )
  }

  console.log(`[signin] ${email} | role=${user.role}`)

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  })

  setSessionCookie(response, session.access_token, session.expires_in ?? 3600)
  return response
}
