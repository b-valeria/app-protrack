"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Plus, Mail, Phone, DollarSign, Edit, Trash2, X, Copy, Check } from "lucide-react"
import { createStaffUser, updateStaffUser, deleteStaffUser } from "@/app/actions/create-staff-user"
import { useRouter } from "next/navigation"

interface StaffMember {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: string
  posicion: string | null
  foto_url: string | null
  salario_base: number | null
  permisos: any
}

interface DirectorStaffProps {
  staff: StaffMember[]
  companyId: string
}

export default function DirectorStaff({ staff: initialStaff, companyId }: DirectorStaffProps) {
  const [staff, setStaff] = useState(initialStaff)
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rol: "Administrador",
    posicion: "",
    salario_base: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && tempPassword) {
      setTempPassword(null)
      setSuccessMessage(null)
    }
  }, [countdown, tempPassword])

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        nombre: member.nombre,
        email: member.email,
        telefono: member.telefono || "",
        rol: member.rol,
        posicion: member.posicion || "",
        salario_base: member.salario_base?.toString() || "",
      })
    } else {
      setEditingMember(null)
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        rol: "Administrador",
        posicion: "",
        salario_base: "",
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCopyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy password:", err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    setTempPassword(null)
    setCountdown(0)

    const { nombre, email, telefono, rol, posicion, salario_base } = formData

    try {
      if (editingMember) {
        console.log("[v0] Updating staff member:", editingMember.id)
        const result = await updateStaffUser(editingMember.id, formData)

        if (!result.success) {
          throw new Error(result.error)
        }

        console.log("[v0] Staff member updated successfully:", result.data)
        setStaff((prevStaff) =>
          prevStaff.map((member) => (member.id === editingMember.id ? { ...member, ...result.data } : member)),
        )
        setSuccessMessage("Empleado actualizado exitosamente")

        setTimeout(() => {
          handleCloseModal()
          router.refresh()
        }, 2000)
      } else {
        console.log("[v0] Creating new staff member with data:", { ...formData, company_id: companyId })
        const result = await createStaffUser({
          ...formData,
          company_id: companyId,
        })

        if (!result.success) {
          console.error("[v0] Error creating staff member:", result.error)
          throw new Error(result.error)
        }

        console.log("[v0] Staff member created successfully:", result.data)
        console.log("[v0] Temporary password:", result.tempPassword)

        setTempPassword(result.tempPassword)
        setCountdown(60)
        setSuccessMessage("Empleado creado exitosamente")

        return
      }
    } catch (err: any) {
      console.error("[v0] Error in handleSubmit:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    setError(null)

    const result = await deleteStaffUser(id)

    if (!result.success) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setStaff((prevStaff) => prevStaff.filter((member) => member.id !== id))
    setSelectedMember(null)
    setShowDetailModal(false)
    setIsLoading(false)
  }

  const handleViewDetails = (member: StaffMember) => {
    setSelectedMember(member)
    setShowDetailModal(true)
  }

  const filteredStaff = staff.filter((member) => member.nombre.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Staff</h2>
          <p className="text-sm text-gray-600 mt-1">Administra los empleados de tu empresa</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4" />
          Agregar Empleado
        </Button>
      </div>

      <input
        type="text"
        placeholder="Buscar empleado..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="bg-white border-4 border-[#0d2646] rounded-3xl p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(member)}
          >
            <div className="aspect-square bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              {member.foto_url ? (
                <Image
                  src={member.foto_url || "/placeholder.svg"}
                  alt={member.nombre}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-6xl font-bold text-[#0d2646]">{member.nombre.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <h3 className="text-center font-semibold text-[#0d2646] text-sm">{member.nombre}</h3>
            <p className="text-center text-xs text-gray-600 mt-1">{member.posicion || member.rol}</p>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron empleados</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMember ? "Editar Empleado" : "Agregar Empleado"}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-medium mb-2">{successMessage}</p>
                  {tempPassword && (
                    <div className="mt-3 p-3 bg-white border-2 border-green-300 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Contraseña temporal (se ocultará en {countdown}s):</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm text-gray-900 select-all">
                          {tempPassword}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCopyPassword}
                          className="gap-2 shrink-0"
                          variant={copied ? "outline" : "default"}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Por favor, guarde esta contraseña y compártala con el empleado de forma segura.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingMember}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    required
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Director General">Director General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                  <input
                    type="text"
                    value={formData.posicion}
                    onChange={(e) => setFormData({ ...formData, posicion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Gerente de Ventas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Guardando..." : editingMember ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Detalles del Empleado</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                    {selectedMember.foto_url ? (
                      <Image
                        src={selectedMember.foto_url || "/placeholder.svg"}
                        alt={selectedMember.nombre}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-5xl font-bold text-[#0d2646]">
                          {selectedMember.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedMember.nombre}</h4>
                  <p className="text-gray-600">{selectedMember.posicion || selectedMember.rol}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-gray-900">{selectedMember.email}</p>
                  </div>

                  {selectedMember.telefono && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Teléfono</span>
                      </div>
                      <p className="text-gray-900">{selectedMember.telefono}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <span className="text-sm font-medium">Rol</span>
                    </div>
                    <p className="text-gray-900">{selectedMember.rol}</p>
                  </div>

                  {selectedMember.salario_base && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Salario Base</span>
                      </div>
                      <p className="text-gray-900">${selectedMember.salario_base.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    onClick={() => {
                      setShowDetailModal(false)
                      handleOpenModal(selectedMember)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    onClick={() => handleDelete(selectedMember.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
