import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getTokenFromRequest, getAuthUserId } from '@/lib/auth'
import type { ApiError } from '@/types'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Sesion no encontrada.' },
      { status: 401 }
    )
  }

  const userId = await getAuthUserId(token)
  if (!userId) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Sesion invalida o expirada.' },
      { status: 401 }
    )
  }

  const supabase = createServerClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status, created_at, approved_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'Usuario no encontrado.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
