"use client"

import type React from "react"
import { createClient } from "../../../lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = []

    if (pwd.length < 8) {
      errors.push("Mínimo 8 caracteres")
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Al menos una letra mayúscula")
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Al menos un número")
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push("Al menos un símbolo (!@#$%^&*...)")
    }

    return errors
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordErrors(validatePassword(newPassword))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setError("La contraseña no cumple con los requisitos de seguridad")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            nombre: nombre,
          },
        },
      })

      if (error) throw error

      if (data.user && !data.session) {
        setSuccess("¡Cuenta creada! Por favor revisa tu correo para confirmar tu cuenta.")
      } else if (data.session) {
        setSuccess("¡Cuenta creada exitosamente!")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      }
    } catch (error: unknown) {
      console.error("[v0] Error en registro:", error)
      setError(error instanceof Error ? error.message : "Ocurrió un error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PROTRACK</h1>
            <p className="mt-2 text-sm text-gray-600">Sistema de Gestión de Inventario</p>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear Cuenta</h2>

            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700">La contraseña debe tener:</p>
                  <ul className="text-xs space-y-1">
                    <li className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                      {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
                      {/[A-Z]/.test(password) ? "✓" : "○"} Al menos una letra mayúscula
                    </li>
                    <li className={/[0-9]/.test(password) ? "text-green-600" : "text-gray-500"}>
                      {/[0-9]/.test(password) ? "✓" : "○"} Al menos un número
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-gray-500"}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"} Al menos un símbolo (!@#$%^&*...)
                    </li>
                  </ul>
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>
              )}

              <button
                type="submit"
                disabled={isLoading || passwordErrors.length > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
