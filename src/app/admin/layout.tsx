import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { SESSION_COOKIE } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    redirect('/login?reason=unauthorized')
  }

  const supabase = createServerClient()
  const { data: authData, error: authError } = await supabase.auth.getUser(token)

  if (authError || !authData.user) {
    redirect('/login?reason=unauthorized')
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', authData.user.id)
    .single()

  if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
    redirect('/')
  }

  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
