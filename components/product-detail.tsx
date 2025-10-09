"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import ConfirmDialog from "./ui/confirm-dialog"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Note: createBrowserClient expects env vars to be set; lib/supabase/client.ts exports a helper but importing it here in a client component may be complex, so we create a browser client directly for simplicity.

import { Product as SharedProduct } from "@/lib/types"

interface Product {
  id: string
  nombre: string
  imagen_url: string | null
  ubicacion: string
  tamano_lote: number
  cantidad_disponible: number
  fecha_expiracion: string
  proveedores: string
  umbral_minimo: number
  umbral_maximo: number
  precio_compra: number
  total_compra: number
  numero_lotes: number
  unidades: number
}

interface Movement {
  tipo_movimiento: string
  unidades: number
  fecha_movimiento: string
  precio_venta: number
  ganancia: number
}

interface Transfer {
  sede_origen: string
  destino: string
  fecha: string
  motivo: string
  encargado: string
}

interface ProductDetailProps {
  product: SharedProduct & Product
  movements: Movement[]
  transfers: Transfer[]
}

export default function ProductDetail({ product, movements, transfers }: ProductDetailProps) {
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(product.nombre)
  const [cantidad, setCantidad] = useState<number>(product.cantidad_disponible)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('products').update({ nombre: name, cantidad_disponible: cantidad }).eq('id', product.id)
      if (error) throw error
      // optionally, you might want to refresh the page or revalidate
      setIsEditing(false)
    } catch (err) {
      console.error('Update product error', err)
      alert('Error actualizando el producto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (error) throw error
      // redirect to dashboard after deletion
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Delete product error', err)
      alert('Error borrando el producto')
    }
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#0d2646] rounded-3xl p-8 text-white">
        <div className="bg-white rounded-2xl p-8 mb-6">
          {product.imagen_url ? (
            <Image
              src={product.imagen_url || "/placeholder.svg"}
              alt={product.nombre}
              width={400}
              height={400}
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-2 uppercase">{product.nombre}</h1>
        <p className="text-lg mb-6">ID: {product.id}</p>

        <div className="space-y-3 text-base">
          <p>
            <span className="font-semibold">Código de Barras:</span> {product['codigo_barras'] ?? '-'}
          </p>
          <p>
            <span className="font-semibold">Última actualización:</span> {product['updated_at'] ? new Date(product['updated_at']).toLocaleString('es-ES') : '—'}
          </p>
          <p>
            <span className="font-semibold">Ubicación:</span> {product.ubicacion}
          </p>
          <p>
            <span className="font-semibold">Tamaño del Lote:</span> {product.tamano_lote.toLocaleString()} unidades
          </p>
          <p>
            <span className="font-semibold">Cantidad Disponible:</span> {product.cantidad_disponible.toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Expiración:</span>{" "}
            {new Date(product.fecha_expiracion).toLocaleDateString("es-ES")}
          </p>
          <p>
            <span className="font-semibold">Proveedores:</span> {product.proveedores}
          </p>
          <p>
            <span className="font-semibold">Umbral Mínimo:</span> {product.umbral_minimo} unidades
          </p>
          <p>
            <span className="font-semibold">Umbral Máximo:</span> {product.umbral_maximo} unidades
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex-1 bg-white text-[#0d2646] hover:bg-gray-100">
              <Edit className="w-4 h-4 mr-2" />
              Editar Producto
            </Button>
              ) : (
            <div className="flex gap-2 w-full">
              <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-2 py-2 rounded border" />
              <input type="text" value={product['codigo_barras'] ?? ''} readOnly className="w-44 px-2 py-2 rounded border bg-gray-100" />
              <input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="w-28 px-2 py-2 rounded border" />
              <Button onClick={handleSave} disabled={saving} className="bg-green-600">{saving ? 'Guardando...' : 'Guardar'}</Button>
              <Button onClick={() => setIsEditing(false)} className="bg-gray-300 text-black">Cancelar</Button>
            </div>
          )}

          <ConfirmDialog title="Borrar producto" description="Esta acción eliminará el producto permanentemente. ¿Deseas continuar?" confirmText="Borrar" onConfirm={handleDelete}>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash className="w-4 h-4" /> Eliminar
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#487fbb] mb-4">Resumen Inversión Inicial</h2>
          <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
            <table className="w-full">
              <thead className="bg-[#487fbb] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Entrada</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nro Lotes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unidades</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Precio Compra</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Total Compra</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-3 text-sm">Inventario Inicial</td>
                  <td className="px-4 py-3 text-sm">{product.numero_lotes}</td>
                  <td className="px-4 py-3 text-sm">{product.unidades.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">${product.precio_compra.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">${product.total_compra.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#487fbb] mb-4">Resumen de Ganancias</h2>
          <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
            <table className="w-full">
              <thead className="bg-[#487fbb] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Movimientos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unidades</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Fecha Movimiento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Precio Venta</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ganancias</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movements.map((movement, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm">{movement.tipo_movimiento}</td>
                      <td className="px-4 py-3 text-sm">{movement.unidades.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(movement.fecha_movimiento).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 text-sm">${movement.precio_venta.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">${movement.ganancia.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#487fbb] mb-4">Resumen de Traslados</h2>
          <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
            <table className="w-full">
              <thead className="bg-[#487fbb] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Sede Origen</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Destino</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Motivo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Encargado</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay traslados registrados
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm">{transfer.sede_origen}</td>
                      <td className="px-4 py-3 text-sm">{transfer.destino}</td>
                      <td className="px-4 py-3 text-sm">{new Date(transfer.fecha).toLocaleDateString("es-ES")}</td>
                      <td className="px-4 py-3 text-sm">{transfer.motivo}</td>
                      <td className="px-4 py-3 text-sm">{transfer.encargado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
