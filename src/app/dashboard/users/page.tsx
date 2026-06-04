'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  status: 'approved' | 'pending_approval' | 'rejected'
  created_at: string
  approved_at?: string | null
}

interface MeResponse {
  user: {
    id: string
    role: 'admin' | 'user'
  }
}

interface UsersResponse {
  users: User[]
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAdminAndFetchUsers = async () => {
      try {
        const meResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!meResponse.ok) {
          router.push('/login')
          return
        }

        const meData = (await meResponse.json()) as MeResponse

        if (meData.user?.role !== 'admin') {
          toast.error('No tienes permiso para acceder a esta pagina')
          router.push('/dashboard')
          return
        }

        const usersResponse = await fetch('/api/admin/users', {
          method: 'GET',
          credentials: 'include',
        })

        if (!usersResponse.ok) {
          toast.error('Error cargando usuarios')
          return
        }

        const data = (await usersResponse.json()) as UsersResponse
        setUsers(data.users ?? [])
      } catch {
        toast.error('Error al cargar la pagina')
      } finally {
        setLoading(false)
      }
    }

    void checkAdminAndFetchUsers()
  }, [router])

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('role update failed')
      }

      toast.success(`Rol actualizado a ${newRole}`)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch {
      toast.error('Error actualizando rol')
    }
  }

  const handleStatusChange = async (
    userId: string,
    newStatus: 'approved' | 'pending_approval' | 'rejected'
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('status update failed')
      }

      toast.success(`Estado actualizado a ${newStatus}`)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: newStatus,
                approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
              }
            : u
        )
      )
    } catch {
      toast.error('Error actualizando estado')
    }
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!window.confirm(`Estas seguro de que quieres eliminar a ${email}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('delete failed')
      }

      toast.success('Usuario eliminado')
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error('Error eliminando usuario')
    }
  }

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesFilter = filter === 'all' || user.role === filter
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
      }),
    [users, filter, searchTerm]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0EDE4]">
        <p className="text-[#1A1A1A] font-black uppercase tracking-widest text-xs">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0EDE4] text-[#1A1A1A] p-6 md:p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-12 border-b-4 border-[#1A1A1A] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-2">
            Gestión de Usuarios
          </h1>
          <p className="text-sm font-bold uppercase opacity-70 tracking-tight">
            Total: {filteredUsers.length} usuario(s) registrados en el sistema
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-black border-2 border-[#1A1A1A] px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#F0EDE4] transition-colors uppercase shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none whitespace-nowrap"
        >
          &lt; Volver al Dashboard
        </Link>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="BUSCAR POR EMAIL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-white border-2 border-[#1A1A1A] px-4 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D94F00] focus:border-transparent placeholder:opacity-40"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'admin' | 'user')}
            className="bg-white border-2 border-[#1A1A1A] px-4 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D94F00] cursor-pointer"
          >
            <option value="all">TODOS LOS ROLES</option>
            <option value="admin">SOLO ADMINS</option>
            <option value="user">SOLO USERS</option>
          </select>
        </div>

        {/* Table */}
        <div className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#F0EDE4]">
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em]">Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em]">Rol</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em]">Registro</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-[#1A1A1A]/10 hover:bg-[#D94F00]/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold uppercase tracking-tight">{user.email}</td>

                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                        className="bg-white border border-[#1A1A1A] px-2 py-1 text-[10px] font-black uppercase tracking-wider cursor-pointer hover:border-[#D94F00] transition-colors"
                      >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(
                            user.id,
                            e.target.value as 'approved' | 'pending_approval' | 'rejected'
                          )
                        }
                        className={`bg-white border-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                          user.status === 'approved' ? 'border-[#4A7C59] text-[#4A7C59]' : 
                          user.status === 'rejected' ? 'border-[#D94F00] text-[#D94F00]' : 
                          'border-[#1A1A1A]/30 text-[#1A1A1A]/50'
                        }`}
                      >
                        <option value="pending_approval">PENDIENTE</option>
                        <option value="approved">APROBADO</option>
                        <option value="rejected">RECHAZADO</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-[10px] font-bold text-[#1A1A1A]/60 uppercase">
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 bg-[#D94F00] text-white border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:brightness-110 transition-all"
                      >
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-[#F5F5F5] border-t border-[#1A1A1A]/10">
              <p className="text-xs font-black uppercase tracking-widest opacity-40">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
