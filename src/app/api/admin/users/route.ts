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
    .select('id, email, role, status, created_at, approved_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ users: data ?? [] })
}
