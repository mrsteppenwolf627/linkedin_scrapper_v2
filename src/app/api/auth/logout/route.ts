// ============================================
// POST /api/auth/logout
// Invalidates the session server-side and clears the HttpOnly cookie.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, clearSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)

  if (token) {
    // Revoke the JWT server-side via Supabase Auth REST
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceKey,
      },
    }).catch((err) => {
      // Non-fatal: cookie will be cleared regardless
      console.warn('[logout] Server-side revocation failed:', err)
    })
  }

  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
