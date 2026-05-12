// ============================================
// GET /api/admin/pending-users
// Lists users awaiting approval or already rejected. Admin only.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import type { ApiError } from '@/types'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, status, created_at')
    .in('status', ['pending_approval', 'rejected'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[pending-users] DB error:', error.message)
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [])
}
