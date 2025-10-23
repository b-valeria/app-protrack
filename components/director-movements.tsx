"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "../lib/supabase/client"
import { Button } from "./ui/button"
import { Plus, Download, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Movement {
  id: string
  product_id: string
  tipo_movimiento: string
  unidades: number
  fecha_movimiento: string
  precio_venta: number | null
  ganancia: number | null
}

interface Transfer {
  id: string
  product_id: string
  sede_origen: string
  destino: string
  fecha: string
  motivo: string
  encargado: string
}

interface Warehouse {
  id: string
  nombre: string
}

interface Product {
  id: string
  nombre: string
}

interface DirectorMovementsProps {
  companyId: string
  warehouses: Warehouse[]
}

export default function DirectorMovements({ companyId, warehouses }: DirectorMovementsProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeView, setActiveView] = useState<"movements" | "transfers">("movements")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"movement" | "transfer">("movement")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const [movementForm, setMovementForm] = useState({
    product_id: "",
    tipo_movimiento: "Entrada",
    unidades: "",
    fecha_movimiento: new Date().toISOString().split("T")[0],
    precio_venta: "",
    ganancia: "",
  })

  const [transferForm, setTransferForm] = useState({
    product_id: "",
    sede_origen: "",
    destino: "",
    fecha: new Date().toISOString().split("T")[0],
    motivo: "",
    encargado: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: movementsData } = await supabase
      .from("movements")
      .select("*")
      .order("fecha_movimiento", { ascending: false })

    const { data: transfersData } = await supabase.from("transfers").select("*").order("fecha", { ascending: false })

    const { data: productsData } = await supabase.from("products").select("id, nombre")

    if (movementsData) setMovements(movementsData)
    if (transfersData) setTransfers(transfersData)
    if (productsData) setProducts(productsData)
  }

  const handleOpenModal = (type: "movement" | "transfer") => {
    setModalType(type)
    setShowModal(true)
    setError(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError(null)
    setMovementForm({
      product_id: "",
      tipo_movimiento: "Entrada",
      unidades: "",
      fecha_movimiento: new Date().toISOString().split("T")[0],
      precio_venta: "",
      ganancia: "",
    })
    setTransferForm({
      product_id: "",
      sede_origen: "",
      destino: "",
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
      encargado: "",
    })
  }

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      const { data, error: insertError } = await supabase
        .from("movements")
        .insert({
          product_id: movementForm.product_id,
          tipo_movimiento: movementForm.tipo_movimiento,
          unidades: Number.parseInt(movementForm.unidades),
          fecha_movimiento: movementForm.fecha_movimiento,
          precio_venta: movementForm.precio_venta ? Number.parseFloat(movementForm.precio_venta) : null,
          ganancia: movementForm.ganancia ? Number.parseFloat(movementForm.ganancia) : null,
          user_id: userData.user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Actualizar cantidad disponible del producto
      if (movementForm.tipo_movimiento === "Entrada") {
        const { error: updateError } = await supabase.rpc("increment_product_quantity", {
          product_id: movementForm.product_id,
          quantity: Number.parseInt(movementForm.unidades),
        })
        if (updateError) {
          // Si no existe la función, actualizar manualmente
          const { data: product } = await supabase
            .from("products")
            .select("cantidad_disponible")
            .eq("id", movementForm.product_id)
            .single()

          if (product) {
            await supabase
              .from("products")
              .update({
                cantidad_disponible: product.cantidad_disponible + Number.parseInt(movementForm.unidades),
              })
              .eq("id", movementForm.product_id)
          }
        }
      } else if (movementForm.tipo_movimiento === "Salida") {
        const { data: product } = await supabase
          .from("products")
          .select("cantidad_disponible")
          .eq("id", movementForm.product_id)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({
              cantidad_disponible: Math.max(0, product.cantidad_disponible - Number.parseInt(movementForm.unidades)),
            })
            .eq("id", movementForm.product_id)
        }
      }

      setMovements([data, ...movements])
      handleCloseModal()
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error al registrar movimiento:", error)
      setError(error.message || "Ocurrió un error al registrar el movimiento")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Usuario no autenticado")

      const { data, error: insertError } = await supabase
        .from("transfers")
        .insert({
          product_id: transferForm.product_id,
          sede_origen: transferForm.sede_origen,
          destino: transferForm.destino,
          fecha: transferForm.fecha,
          motivo: transferForm.motivo,
          encargado: transferForm.encargado,
          user_id: userData.user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setTransfers([data, ...transfers])
      handleCloseModal()
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error al registrar transferencia:", error)
      setError(error.message || "Ocurrió un error al registrar la transferencia")
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    const data = activeView === "movements" ? movements : transfers

    if (data.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeView}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registro de Movimientos</h2>
          <p className="text-sm text-gray-600 mt-1">Visualiza y registra movimientos de inventario</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button
            className="gap-2"
            onClick={() => handleOpenModal(activeView === "movements" ? "movement" : "transfer")}
          >
            <Plus className="w-4 h-4" />
            Registrar {activeView === "movements" ? "Movimiento" : "Transferencia"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={activeView === "movements" ? "default" : "outline"} onClick={() => setActiveView("movements")}>
          Movimientos
        </Button>
        <Button variant={activeView === "transfers" ? "default" : "outline"} onClick={() => setActiveView("transfers")}>
          Transferencias
        </Button>
      </div>

      {activeView === "movements" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganancia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {products.find((p) => p.id === movement.product_id)?.nombre || movement.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          movement.tipo_movimiento === "Entrada"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {movement.tipo_movimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.unidades}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(movement.fecha_movimiento).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.precio_venta ? `$${movement.precio_venta}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.ganancia ? `$${movement.ganancia}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Encargado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {products.find((p) => p.id === transfer.product_id)?.nombre || transfer.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.sede_origen}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.destino}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transfer.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.motivo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.encargado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {((activeView === "movements" && movements.length === 0) ||
        (activeView === "transfers" && transfers.length === 0)) && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No hay registros disponibles</p>
        </div>
      )}

      {/* Modal para registrar movimiento */}
      {showModal && modalType === "movement" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Registrar Movimiento</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                  <select
                    required
                    value={movementForm.product_id}
                    onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento *</label>
                  <select
                    required
                    value={movementForm.tipo_movimiento}
                    onChange={(e) => setMovementForm({ ...movementForm, tipo_movimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                    <option value="B2B">B2B</option>
                    <option value="Online">Online</option>
                    <option value="Consultiva">Consultiva</option>
                    <option value="Venta Directa">Venta Directa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidades *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={movementForm.unidades}
                    onChange={(e) => setMovementForm({ ...movementForm, unidades: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={movementForm.fecha_movimiento}
                    onChange={(e) => setMovementForm({ ...movementForm, fecha_movimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={movementForm.precio_venta}
                    onChange={(e) => setMovementForm({ ...movementForm, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia</label>
                  <input
                    type="number"
                    step="0.01"
                    value={movementForm.ganancia}
                    onChange={(e) => setMovementForm({ ...movementForm, ganancia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar transferencia */}
      {showModal && modalType === "transfer" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Registrar Transferencia</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                  <select
                    required
                    value={transferForm.product_id}
                    onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sede Origen *</label>
                  <select
                    required
                    value={transferForm.sede_origen}
                    onChange={(e) => setTransferForm({ ...transferForm, sede_origen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar sede</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.nombre}>
                        {warehouse.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                  <select
                    required
                    value={transferForm.destino}
                    onChange={(e) => setTransferForm({ ...transferForm, destino: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar destino</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.nombre}>
                        {warehouse.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.fecha}
                    onChange={(e) => setTransferForm({ ...transferForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                  <input
                    type="text"
                    required
                    value={transferForm.motivo}
                    onChange={(e) => setTransferForm({ ...transferForm, motivo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Encargado *</label>
                  <input
                    type="text"
                    required
                    value={transferForm.encargado}
                    onChange={(e) => setTransferForm({ ...transferForm, encargado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 bg-transparent">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
