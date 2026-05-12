import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ApiError } from '@/types'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Body JSON invalido' },
      { status: 400 }
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Email y contrasena son requeridos.' },
      { status: 400 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json<ApiError>(
      { error: 'Internal Server Error', message: 'Configuracion de servidor incorrecta.' },
      { status: 500 }
    )
  }

  let authResponse: Response
  try {
    authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'Internal Server Error', message: 'Error de conexion al servidor de autenticacion.' },
      { status: 500 }
    )
  }

  if (!authResponse.ok) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Email o contrasena incorrectos.' },
      { status: 401 }
    )
  }

  const session = (await authResponse.json()) as {
    access_token: string
    user: { id: string }
  }

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
      { error: 'Forbidden', message: 'Tu cuenta aun no ha sido aprobada.' },
      { status: 403 }
    )
  }

  if (user.status === 'rejected') {
    return NextResponse.json<ApiError>(
      { error: 'Forbidden', message: 'Tu cuenta ha sido rechazada.' },
      { status: 403 }
    )
  }

  const response = NextResponse.redirect(new URL('/dashboard', req.url))
  response.cookies.set('auth-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  return response
}
