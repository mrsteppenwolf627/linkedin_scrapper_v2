"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SigninFormProps {
  email: string
  isLoading: boolean
  onLoadingChange: (loading: boolean) => void
}

export function SigninForm({ email, isLoading, onLoadingChange }: SigninFormProps) {
  const router = useRouter()
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("El email es requerido")
      return
    }
    if (!password) {
      toast.error("La contraseña es requerida")
      return
    }

    onLoadingChange(true)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Credenciales inválidas")
        return
      }

      toast.success("¡Bienvenido!")
      router.push("/app/messages")
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      onLoadingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold block">CONTRASEÑA</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className="w-full bg-transparent border border-input rounded-none py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <button 
        type="submit" 
        className="w-full bg-[#FCFCFC] text-[#1A1A1A] font-bold uppercase tracking-[0.2em] py-3 px-6 rounded-none hover:bg-white/90 transition-all flex items-center justify-center disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "INICIAR SESIÓN"}
      </button>
    </form>
  )
}
