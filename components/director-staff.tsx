"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "./ui/button"
import { Plus, Mail, Phone, DollarSign, Edit, Trash2, X } from "lucide-react"
import { createClient } from "../lib/supabase/client"
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
  const supabase = createClient()
  const router = useRouter()

  const filteredStaff = staff.filter((member) => member.nombre.toLowerCase().includes(searchQuery.toLowerCase()))

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
    setError(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (editingMember) {
        // Actualizar empleado existente
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono || null,
            rol: formData.rol,
            posicion: formData.posicion || null,
            salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : null,
          })
          .eq("id", editingMember.id)

        if (updateError) throw updateError

        // Actualizar estado local
        setStaff(
          staff.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  nombre: formData.nombre,
                  email: formData.email,
                  telefono: formData.telefono || null,
                  rol: formData.rol,
                  posicion: formData.posicion || null,
                  salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : null,
                }
              : m,
          ),
        )
      } else {
        // Crear nuevo empleado - primero crear usuario en Auth
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!"

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            nombre: formData.nombre,
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("No se pudo crear el usuario")

        // Crear perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono || null,
            rol: formData.rol,
            posicion: formData.posicion || null,
            salario_base: formData.salario_base ? Number.parseFloat(formData.salario_base) : null,
            company_id: companyId,
          })
          .select()
          .single()

        if (profileError) throw profileError

        // Agregar al estado local
        setStaff([...staff, profileData])
      }

      handleCloseModal()
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error al guardar empleado:", error)
      setError(error.message || "Ocurrió un error al guardar el empleado")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (memberId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este empleado?")) return

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", memberId)

      if (error) throw error

      setStaff(staff.filter((m) => m.id !== memberId))
      setShowDetailModal(false)
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error al eliminar empleado:", error)
      alert("Error al eliminar el empleado: " + error.message)
    }
  }

  const handleViewDetails = (member: StaffMember) => {
    setSelectedMember(member)
    setShowDetailModal(true)
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3">
                  {member.foto_url ? (
                    <Image
                      src={member.foto_url || "/placeholder.svg"}
                      alt={member.nombre}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-600">
                      {member.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">{member.nombre}</h3>
                <p className="text-sm text-gray-600">{member.posicion || member.rol}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.telefono && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{member.telefono}</span>
                  </div>
                )}
                {member.salario_base && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span>${member.salario_base.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="outline" className="w-full bg-transparent" onClick={() => handleViewDetails(member)}>
                  Ver Detalles
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron empleados</p>
        </div>
      )}

      {/* Modal para crear/editar empleado */}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingMember}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    required
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Empleado">Empleado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                  <input
                    type="text"
                    value={formData.posicion}
                    onChange={(e) => setFormData({ ...formData, posicion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

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

      {/* Modal de detalles */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Detalles del Empleado</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center mb-6">
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
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                        {selectedMember.nombre.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedMember.nombre}</h4>
                  <p className="text-gray-600">{selectedMember.posicion || selectedMember.rol}</p>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm text-gray-500">Rol ProTrack</p>
                    <p className="font-medium text-gray-900">{selectedMember.rol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Correo Electrónico</p>
                    <p className="font-medium text-gray-900">{selectedMember.email}</p>
                  </div>
                  {selectedMember.telefono && (
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">{selectedMember.telefono}</p>
                    </div>
                  )}
                  {selectedMember.salario_base && (
                    <div>
                      <p className="text-sm text-gray-500">Salario Base</p>
                      <p className="font-medium text-gray-900">${selectedMember.salario_base.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
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
                    variant="destructive"
                    className="flex-1 gap-2"
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
