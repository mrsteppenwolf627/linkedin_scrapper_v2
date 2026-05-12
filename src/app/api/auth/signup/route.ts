// ============================================
// POST /api/auth/signup
// Registers a new user with pending_approval status.
// ALL users (including the admin email) are pending until approved via SQL seed.
// Admin accounts must NEVER be created through this endpoint.
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

  // ── Create in Supabase Auth ─────────────────────────────────────────────────
  // email_confirm: true — marks the email as verified in Supabase Auth so users
  // can sign in after admin approval without a separate email-verification step.
  // Access is still gated by users.status = 'approved' in the signin endpoint.
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

  // ── Insert into custom users table — always pending, always role='user' ─────
  const { error: insertError } = await supabase.from('users').insert({
    id:     authData.user.id,
    email,
    role:   'user',
    status: 'pending_approval',
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

  console.log(`[signup] ${email} | role=user | status=pending_approval`)

  return NextResponse.json(
    { success: true, message: 'Registro completado. Tu cuenta está pendiente de aprobación por el administrador.' },
    { status: 201 }
  )
}
