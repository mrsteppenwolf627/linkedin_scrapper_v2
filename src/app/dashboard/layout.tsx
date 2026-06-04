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
    <div className="min-h-screen bg-[#F0EDE4] text-[#1A1A1A]">
      {children}
    </div>
  )
}
