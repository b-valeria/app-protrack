"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Check, X } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setError("Enlace de recuperación inválido o expirado. Por favor, solicita uno nuevo.")
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError("La contraseña no cumple con todos los requisitos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)

      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al actualizar la contraseña")
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva Contraseña</h2>
            <p className="text-sm text-gray-600 mb-6">Ingresa tu nueva contraseña para tu cuenta.</p>

            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                <p className="font-medium mb-1">Contraseña actualizada exitosamente</p>
                <p className="text-sm">Redirigiendo al inicio de sesión...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {password.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div
                        className={`flex items-center gap-2 ${passwordRequirements.minLength ? "text-green-600" : "text-gray-500"}`}
                      >
                        {passwordRequirements.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? "text-green-600" : "text-gray-500"}`}
                      >
                        {passwordRequirements.hasUppercase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>Al menos una mayúscula</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? "text-green-600" : "text-gray-500"}`}
                      >
                        {passwordRequirements.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>Al menos un número</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 ${passwordRequirements.hasSymbol ? "text-green-600" : "text-gray-500"}`}
                      >
                        {passwordRequirements.hasSymbol ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        <span>Al menos un símbolo (!@#$%^&*)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div
                      className={`mt-2 flex items-center gap-2 text-sm ${passwordsMatch ? "text-green-600" : "text-red-600"}`}
                    >
                      {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}</span>
                    </div>
                  )}
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
