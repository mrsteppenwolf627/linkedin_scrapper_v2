"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

      toast.success("¡Cuenta creada correctamente!")
      router.push("/login?reason=pending")
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="nombre@empresa.com"
          required
          className="rounded-sm border-input bg-background"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password" rounded-sm className="text-sm font-medium text-foreground">
          Contraseña
        </Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          required
          className="rounded-sm border-input bg-background"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
        />
        <p className="text-[10px] text-muted-foreground mt-1">Mínimo 8 caracteres</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" rounded-sm className="text-sm font-medium text-foreground">
          Confirmar Contraseña
        </Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          required
          className="rounded-sm border-input bg-background"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground font-medium rounded-sm py-2 hover:opacity-90 transition-opacity" 
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrarse"}
      </Button>
    </form>
  )
}
