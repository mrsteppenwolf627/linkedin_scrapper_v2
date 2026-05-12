"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        if (res.status === 403) {
          if (data.message?.toLowerCase().includes("aprobada")) {
            router.push("/login?reason=pending")
            return
          }
          if (data.message?.toLowerCase().includes("rechazada")) {
            router.push("/login?reason=rejected")
            return
          }
        }
        toast.error(data.message || "Email o contraseña incorrectos")
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </Label>
        <Input
          id="email"
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
        <Label htmlFor="password" id="password-label" className="text-sm font-medium text-foreground">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          required
          className="rounded-sm border-input bg-background"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-primary text-primary-foreground font-medium rounded-sm py-2 hover:opacity-90 transition-opacity" 
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
      </Button>
    </form>
  )
}
