// ============================================
// POST /api/admin/reject-user/:id
// Rejects a pending user. Admin only.
// Optional body: { reason: string }
// UPDATE + audit log INSERT are atomic via the reject_user() SQL function.
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

  // Optional rejection reason
  let reason: string | null = null
  try {
    const body = await req.json()
    reason = typeof body.reason === 'string' ? body.reason.trim() || null : null
  } catch {
    // Body is optional
  }

  const supabase = createServerClient()

  // ── Single atomic call: UPDATE users + INSERT user_approvals ───────────────
  const { data, error } = await supabase.rpc('reject_user', {
    p_user_id:  userId,
    p_admin_id: admin.adminId,
    p_reason:   reason,
  })

  if (error) {
    if (error.message.includes('not found') || error.message.includes('not in pending')) {
      return NextResponse.json<ApiError>(
        { error: 'Not Found', message: 'Usuario no encontrado o ya no está pendiente.' },
        { status: 404 }
      )
    }
    console.error('[reject-user] RPC error:', error.message)
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  const result = data as { email: string; status: string }
  console.log(`[admin] REJECTED ${result.email} by ${admin.adminEmail}${reason ? ` — "${reason}"` : ''}`)

  return NextResponse.json({ success: true, user: result })
}
