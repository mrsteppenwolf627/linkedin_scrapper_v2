"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SignupFormProps {
  email: string
  isLoading: boolean
  onLoadingChange: (loading: boolean) => void
}

export function SignupForm({ email, isLoading, onLoadingChange }: SignupFormProps) {
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

      toast.success("Cuenta creada correctamente")
      window.location.href = "/login?reason=pending"
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      onLoadingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-6">
      <div className="flex flex-col w-full space-y-4">
        <input
          type="password"
          required
          placeholder="CONTRASENA"
          className="w-full bg-transparent border border-input rounded-none py-3 px-4 text-white placeholder:text-[rgb(120,120,120)] placeholder:opacity-100 focus:outline-none focus:border-white transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="password"
          required
          placeholder="CONFIRMAR CONTRASENA"
          className="w-full bg-transparent border border-input rounded-none py-3 px-4 text-white placeholder:text-[rgb(120,120,120)] placeholder:opacity-100 focus:outline-none focus:border-white transition-colors"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-[#FCFCFC] text-[#1A1A1A] font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-none hover:bg-white/90 transition-all flex items-center justify-center disabled:opacity-50 mt-4"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "REGISTRARSE"}
      </button>
    </form>
  )
}
