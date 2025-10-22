"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  product: Product
  movements: Movement[]
  transfers: Transfer[]
}

export default function ProductDetail({ product, movements, transfers }: ProductDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(product.imagen_url)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      let imageUrl = product.imagen_url
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json()
          imageUrl = url
        }
      }

      const productData = {
        nombre: formData.get("nombre") as string,
        ubicacion: formData.get("ubicacion") as string,
        numero_lotes: Number.parseInt(formData.get("numero_lotes") as string),
        tamano_lote: Number.parseInt(formData.get("tamano_lote") as string),
        unidades: Number.parseInt(formData.get("unidades") as string),
        cantidad_disponible: Number.parseInt(formData.get("cantidad_disponible") as string),
        fecha_expiracion: formData.get("fecha_expiracion") as string,
        proveedores: formData.get("proveedores") as string,
        entrada: formData.get("entrada") as string,
        precio_compra: Number.parseFloat(formData.get("precio_compra") as string),
        total_compra: Number.parseFloat(formData.get("total_compra") as string),
        imagen_url: imageUrl,
      }

      const { error } = await supabase.from("products").update(productData).eq("id", product.id)

      if (error) throw error

      setIsEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      alert("Error al actualizar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id)

      if (error) throw error

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      alert("Error al eliminar el producto. Por favor, intenta de nuevo.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
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

          <Button onClick={() => setIsEditOpen(true)} className="mt-6 w-full bg-white text-[#0d2646] hover:bg-gray-100">
            <Edit className="w-4 h-4 mr-2" />
            Editar Producto
          </Button>
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0d2646]">Editar Producto</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nombre">Nombre del Producto</Label>
                <Input id="nombre" name="nombre" defaultValue={product.nombre} required className="mt-2" />
              </div>

              <div>
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input id="ubicacion" name="ubicacion" defaultValue={product.ubicacion} required className="mt-2" />
              </div>

              <div>
                <Label htmlFor="numero_lotes">Número de Lotes</Label>
                <Input
                  id="numero_lotes"
                  name="numero_lotes"
                  type="number"
                  defaultValue={product.numero_lotes}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="tamano_lote">Tamaño del Lote</Label>
                <Input
                  id="tamano_lote"
                  name="tamano_lote"
                  type="number"
                  defaultValue={product.tamano_lote}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="unidades">Unidades Totales</Label>
                <Input
                  id="unidades"
                  name="unidades"
                  type="number"
                  defaultValue={product.unidades}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="cantidad_disponible">Cantidad Disponible</Label>
                <Input
                  id="cantidad_disponible"
                  name="cantidad_disponible"
                  type="number"
                  defaultValue={product.cantidad_disponible}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="fecha_expiracion">Fecha de Expiración</Label>
                <Input
                  id="fecha_expiracion"
                  name="fecha_expiracion"
                  type="date"
                  defaultValue={product.fecha_expiracion}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="proveedores">Proveedores</Label>
                <Input
                  id="proveedores"
                  name="proveedores"
                  defaultValue={product.proveedores}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="entrada">Tipo de Entrada</Label>
                <Input id="entrada" name="entrada" defaultValue="Inventario Inicial" required className="mt-2" />
              </div>

              <div>
                <Label htmlFor="precio_compra">Precio de Compra</Label>
                <Input
                  id="precio_compra"
                  name="precio_compra"
                  type="number"
                  step="0.01"
                  defaultValue={product.precio_compra}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="total_compra">Total de Compra</Label>
                <Input
                  id="total_compra"
                  name="total_compra"
                  type="number"
                  step="0.01"
                  defaultValue={product.total_compra}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Imagen del Producto</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
              {imagePreview && (
                <div className="mt-4">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Vista previa"
                    width={200}
                    height={200}
                    className="rounded-lg border-2 border-[#0d2646]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1"
                disabled={isLoading || isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isDeleting}
                className="flex-1 bg-[#0d2646] hover:bg-[#213a55] text-white"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
