'use server'

import type { ReactNode } from 'react'
import { requireApproved } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireApproved()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
