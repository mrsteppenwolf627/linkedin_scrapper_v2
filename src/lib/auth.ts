import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const SESSION_COOKIE = 'auth-token'

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

interface ApprovedUserContext {
  id: string
  email: string
  role: string
  status: string
}

export async function requireApproved(): Promise<ApprovedUserContext> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    redirect('/login?reason=unauthorized')
  }

  const userId = await getAuthUserId(token)
  if (!userId) {
    redirect('/login?reason=unauthorized')
  }

  const supabase = createServerClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', userId)
    .single()

  if (error || !user) {
    redirect('/login?reason=unauthorized')
  }

  if (user.status === 'pending_approval') {
    redirect('/login?reason=pending')
  }

  if (user.status === 'rejected') {
    redirect('/login?reason=rejected')
  }

  if (user.status !== 'approved') {
    redirect('/login?reason=unauthorized')
  }

  return {
    id: user.id as string,
    email: user.email as string,
    role: user.role as string,
    status: user.status as string,
  }
}

interface AdminContext {
  adminId: string
  adminEmail: string
}

export async function requireAdmin(
  req: NextRequest
): Promise<AdminContext | NextResponse> {
  const token = getTokenFromRequest(req)
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sesion no encontrada. Inicia sesion primero.' },
      { status: 401 }
    )
  }

  const userId = await getAuthUserId(token)
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Sesion invalida o expirada.' },
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
