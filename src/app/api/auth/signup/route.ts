// ============================================
// POST /api/auth/signup
// Registers a new user with pending_approval status.
// Admin email (NEXT_PUBLIC_ADMIN_EMAIL) is auto-approved.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ApiError } from '@/types'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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

  // ── Input validation ────────────────────────────────────────────────────────
  if (!isValidEmail(email)) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Email inválido.' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'La contraseña debe tener al menos 8 caracteres.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // ── Check duplicate in custom users table ──────────────────────────────────
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json<ApiError>(
      { error: 'Conflict', message: 'Este email ya está registrado.' },
      { status: 409 }
    )
  }

  // ── Determine role/status ───────────────────────────────────────────────────
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isAdmin    = !!adminEmail && email === adminEmail.toLowerCase()
  const role       = isAdmin ? 'admin' : 'user'
  const status     = isAdmin ? 'approved' : 'pending_approval'

  // ── Create in Supabase Auth (email_confirm: true skips email verification) ──
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return NextResponse.json<ApiError>(
        { error: 'Conflict', message: 'Este email ya está registrado.' },
        { status: 409 }
      )
    }
    console.error('[signup] Supabase auth error:', authError.message)
    return NextResponse.json<ApiError>(
      { error: 'Internal Server Error', message: 'Error al crear la cuenta. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  // ── Insert into custom users table ─────────────────────────────────────────
  const { error: insertError } = await supabase.from('users').insert({
    id:          authData.user.id,
    email,
    role,
    status,
    approved_at: isAdmin ? new Date().toISOString() : null,
  })

  if (insertError) {
    // Rollback: remove from Supabase Auth to keep both tables in sync
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
    console.error('[signup] DB insert error:', insertError.message)
    return NextResponse.json<ApiError>(
      { error: 'Internal Server Error', message: 'Error al guardar el usuario.' },
      { status: 500 }
    )
  }

  console.log(`[signup] ${email} | role=${role} | status=${status}`)

  const message = isAdmin
    ? 'Cuenta de administrador creada. Ya puedes iniciar sesión.'
    : 'Registro completado. Tu cuenta está pendiente de aprobación por el administrador.'

  return NextResponse.json({ success: true, message }, { status: 201 })
}
