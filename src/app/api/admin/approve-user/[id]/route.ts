// ============================================
// POST /api/admin/approve-user/:id
// Approves a pending user. Admin only.
// Writes audit log to user_approvals.
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

  // ── Verify user exists and is pending ──────────────────────────────────────
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('id, email, status')
    .eq('id', userId)
    .single()

  if (fetchErr || !user) {
    return NextResponse.json<ApiError>(
      { error: 'Not Found', message: 'Usuario no encontrado.' },
      { status: 404 }
    )
  }

  if (user.status !== 'pending_approval') {
    return NextResponse.json<ApiError>(
      { error: 'Conflict', message: `El usuario ya tiene estado "${user.status}".` },
      { status: 409 }
    )
  }

  // ── UPDATE users ───────────────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('users')
    .update({
      status:      'approved',
      approved_at: new Date().toISOString(),
      approved_by: admin.adminId,
    })
    .eq('id', userId)

  if (updateErr) {
    console.error('[approve-user] Update error:', updateErr.message)
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: updateErr.message },
      { status: 500 }
    )
  }

  // ── INSERT audit log ───────────────────────────────────────────────────────
  const { error: auditErr } = await supabase.from('user_approvals').insert({
    user_id:     userId,
    approved_by: admin.adminId,
    status:      'approved',
  })

  if (auditErr) {
    // Non-fatal: approval already committed; log and continue
    console.error('[approve-user] Audit log error:', auditErr.message)
  }

  console.log(`[admin] APPROVED ${user.email} by ${admin.adminEmail}`)

  return NextResponse.json({
    success: true,
    user: { email: user.email, status: 'approved' },
  })
}
