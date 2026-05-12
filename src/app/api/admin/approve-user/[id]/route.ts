// ============================================
// POST /api/admin/approve-user/:id
// Approves a pending user. Admin only.
// UPDATE + audit log INSERT are atomic via the approve_user() SQL function.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import type { ApiError } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { id: userId } = await params
  if (!userId) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'User ID requerido en la URL.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // ── Single atomic call: UPDATE users + INSERT user_approvals ───────────────
  // The approve_user() function uses FOR UPDATE + runs both statements in the
  // same implicit transaction, so either both succeed or both roll back.
  const { data, error } = await supabase.rpc('approve_user', {
    p_user_id:  userId,
    p_admin_id: admin.adminId,
  })

  if (error) {
    if (error.message.includes('not found') || error.message.includes('not in pending')) {
      return NextResponse.json<ApiError>(
        { error: 'Not Found', message: 'Usuario no encontrado o ya no está pendiente.' },
        { status: 404 }
      )
    }
    console.error('[approve-user] RPC error:', error.message)
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  const result = data as { email: string; status: string }
  console.log(`[admin] APPROVED ${result.email} by ${admin.adminEmail}`)

  return NextResponse.json({ success: true, user: result })
}
