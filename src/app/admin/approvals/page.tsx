'use client'

import { useEffect, useMemo, useState } from 'react'

interface User {
  id: string
  email: string
  status: 'pending_approval' | 'rejected'
  created_at: string
}

type PendingUsersResponse = User[] | { users?: User[] }

function formatRequestedDate(isoDate: string): string {
  const date = new Date(isoDate)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<string | null>(null)

  useEffect(() => {
    void fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setError(null)
      const response = await fetch('/api/admin/pending-users', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = (await response.json()) as PendingUsersResponse
      const nextUsers = Array.isArray(data) ? data : data.users ?? []
      setUsers(nextUsers)
    } catch {
      setError('Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function approveUser(userId: string) {
    try {
      setActionUserId(userId)
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve user')
      }

      await fetchUsers()
    } catch {
      setError('No se pudo aprobar el usuario')
    } finally {
      setActionUserId(null)
    }
  }

  async function rejectUser(userId: string) {
    try {
      setActionUserId(userId)
      const response = await fetch(`/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Failed to reject user')
      }

      await fetchUsers()
    } catch {
      setError('No se pudo rechazar el usuario')
    } finally {
      setActionUserId(null)
    }
  }

  const rows = useMemo(() => users, [users])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground [--background:oklch(0.95_0.01_82)] [--foreground:oklch(0.22_0_0)] [--primary:oklch(0.66_0.2_50)] [--primary-foreground:oklch(0.98_0_0)] [--secondary:oklch(0.57_0.08_150)] [--secondary-foreground:oklch(0.98_0_0)] p-8">
        <p className="text-sm uppercase tracking-wide">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground [--background:oklch(0.95_0.01_82)] [--foreground:oklch(0.22_0_0)] [--primary:oklch(0.66_0.2_50)] [--primary-foreground:oklch(0.98_0_0)] [--secondary:oklch(0.57_0.08_150)] [--secondary-foreground:oklch(0.98_0_0)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl border-2 border-foreground bg-background p-4 md:p-6">
        <h1 className="mb-6 border-b-2 border-foreground pb-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
          Aprobaciones Pendientes
        </h1>

        {error && (
          <div className="mb-4 border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {rows.length === 0 ? (
          <p className="text-sm uppercase tracking-wide text-foreground/70">
            No hay usuarios pendientes o rechazados
          </p>
        ) : (
          <div className="overflow-x-auto border border-foreground/30">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="border-b border-foreground/30 bg-secondary/20">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wide">Requested</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const isPending = user.status === 'pending_approval'
                  const isRunning = actionUserId === user.id

                  return (
                    <tr key={user.id} className="border-b border-foreground/20 hover:bg-secondary/10">
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={isPending ? 'text-primary' : 'text-destructive'}>
                          {isPending ? 'Pending Approval' : 'Rejected'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatRequestedDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => approveUser(user.id)}
                            disabled={isRunning}
                            className="border border-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectUser(user.id)}
                            disabled={isRunning}
                            className="border border-destructive px-3 py-1 text-xs font-bold uppercase tracking-wide text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
