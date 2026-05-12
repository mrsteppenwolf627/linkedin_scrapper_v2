'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gestion de Usuarios</h1>
        <p className="text-gray-600">Total: {filteredUsers.length} usuario(s)</p>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'admin' | 'user')}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Solo Admins</option>
          <option value="user">Solo Users</option>
        </select>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Rol</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Fecha Registro</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-sm">{user.email}</td>

                <td className="px-6 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                    className="px-3 py-1 border rounded bg-white text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

                <td className="px-6 py-3">
                  <select
                    value={user.status}
                    onChange={(e) =>
                      handleStatusChange(
                        user.id,
                        e.target.value as 'approved' | 'pending_approval' | 'rejected'
                      )
                    }
                    className="px-3 py-1 border rounded bg-white text-sm cursor-pointer hover:bg-gray-50"
                  >
                    <option value="pending_approval">Pendiente</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </td>

                <td className="px-6 py-3 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </td>

                <td className="px-6 py-3">
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">No se encontraron usuarios</div>
      )}
    </div>
  )
}
