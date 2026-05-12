"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Error al registrarse")
        return
      }

      toast.success("Cuenta creada. Espera la aprobación.")
      router.push("/login?reason=pending")
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses = "w-full bg-transparent border border-white/20 rounded-sm px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-widest text-white/50 font-medium">Confirmar Contraseña</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          className={inputClasses}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-white/90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Registrarse"}
      </button>
    </form>
  )
}
