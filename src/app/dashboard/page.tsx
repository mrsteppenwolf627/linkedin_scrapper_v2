'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MeResponse {
  user: {
    id: string
    email: string
    role: 'admin' | 'user'
    status: 'approved' | 'pending_approval' | 'rejected'
  }
}

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = (await response.json()) as MeResponse
        setIsAdmin(data.user?.role === 'admin')
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    void checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {isAdmin && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Link href="/dashboard/users">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
              Gestionar Usuarios
            </button>
          </Link>
          <p className="text-sm text-gray-600 mt-2">
            Panel exclusivo de administrador para gestionar todos los usuarios del sistema
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Busquedas</h2>
          <p className="text-gray-600">Gestiona tus busquedas de LinkedIn</p>
          <Link href="/dashboard/searches">
            <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
              Ver
            </button>
          </Link>
        </div>

        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Mensajes</h2>
          <p className="text-gray-600">Ver tus mensajes y secuencias</p>
          <Link href="/dashboard/messages">
            <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
              Ver
            </button>
          </Link>
        </div>

        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">Lotes</h2>
          <p className="text-gray-600">Gestiona tus lotes de busqueda</p>
          <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">
            Proximamente
          </button>
        </div>
      </div>
    </div>
  )
}
