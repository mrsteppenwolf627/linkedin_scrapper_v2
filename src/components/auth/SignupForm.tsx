"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AuthFormProps {
  email: string
  isLoading: boolean
  onLoadingChange: (loading: boolean) => void
}

export function SignupForm({ email, isLoading, onLoadingChange }: AuthFormProps) {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("El email es requerido")
      return
    }
    
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    onLoadingChange(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Error al registrarse")
        return
      }

      toast.success("Cuenta creada. Espera la aprobación.")
      window.location.href = "/login?reason=pending"
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      onLoadingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold block">Contraseña</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className="w-full bg-transparent border border-input rounded-none px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-white transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold block">Confirmar Contraseña</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className="w-full bg-transparent border border-input rounded-none px-3 py-2 text-white placeholder:text-white/20 focus:outline-none focus:border-white transition-colors"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-[#FCFCFC] text-[#1A1A1A] font-black uppercase tracking-[0.2em] py-4 rounded-none hover:bg-white/90 transition-all flex items-center justify-center disabled:opacity-50 mt-4"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Registrarse"}
      </button>
    </form>
  )
}
