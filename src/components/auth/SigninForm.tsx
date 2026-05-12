"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function SigninForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      setIsLoading(false)
    }
  }

  const inputClasses = "w-full bg-transparent border border-white/20 rounded-sm px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-widest text-white/50 font-medium">Email</label>
        <input
          type="email"
          required
          placeholder="nombre@empresa.com"
          className={inputClasses}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-widest text-white/50 font-medium">Contraseña</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className={inputClasses}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-white/90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Iniciar Sesión"}
      </button>
    </form>
  )
}
