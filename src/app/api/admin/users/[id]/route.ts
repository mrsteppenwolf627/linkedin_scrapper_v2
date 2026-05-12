import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import type { ApiError } from '@/types'

interface UpdateBody {
  role?: 'admin' | 'user'
  status?: 'approved' | 'pending_approval' | 'rejected'
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  if (!id) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'User ID requerido en la URL.' },
      { status: 400 }
    )
  }

  let body: UpdateBody
  try {
    body = (await req.json()) as UpdateBody
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Body JSON invalido' },
      { status: 400 }
    )
  }

  const payload: Record<string, unknown> = {}

  if (body.role) {
    if (body.role !== 'admin' && body.role !== 'user') {
      return NextResponse.json<ApiError>(
        { error: 'Bad Request', message: 'Rol invalido.' },
        { status: 400 }
      )
    }
    payload.role = body.role
  }

  if (body.status) {
    if (!['approved', 'pending_approval', 'rejected'].includes(body.status)) {
      return NextResponse.json<ApiError>(
        { error: 'Bad Request', message: 'Estado invalido.' },
        { status: 400 }
      )
    }
    payload.status = body.status
    payload.approved_at = body.status === 'approved' ? new Date().toISOString() : null
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'No hay campos para actualizar.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select('id, email, role, status, created_at, approved_at')
    .single()

  if (error || !data) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error?.message ?? 'No se pudo actualizar.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, user: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  if (!id) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'User ID requerido en la URL.' },
      { status: 400 }
    )
  }

  if (id === admin.adminId) {
    return NextResponse.json<ApiError>(
      { error: 'Forbidden', message: 'No puedes eliminar tu propio usuario admin.' },
      { status: 403 }
    )
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
