"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { createClient } from "../lib/supabase/client"
import Image from "next/image"

interface AddProductFormProps {
  userId: string
}

export default function AddProductForm({ userId }: AddProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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

      let imageUrl = null
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
        id: formData.get("id") as string,
        nombre: formData.get("nombre") as string,
        ubicacion: formData.get("ubicacion") as string,
        numero_lotes: Number.parseInt(formData.get("numero_lotes") as string),
        tamano_lote: Number.parseInt(formData.get("tamano_lote") as string),
        unidades: Number.parseInt(formData.get("unidades") as string),
        cantidad_disponible: Number.parseInt(formData.get("cantidad_disponible") as string),
        fecha_expiracion: formData.get("fecha_expiracion") as string,
        proveedores: formData.get("proveedores") as string,
        umbral_minimo: Number.parseInt(formData.get("umbral_minimo") as string),
        umbral_maximo: Number.parseInt(formData.get("umbral_maximo") as string),
        entrada: formData.get("entrada") as string,
        precio_compra: Number.parseFloat(formData.get("precio_compra") as string),
        total_compra: Number.parseFloat(formData.get("total_compra") as string),
        imagen_url: imageUrl,
        user_id: userId,
      }

      const { error } = await supabase.from("products").insert([productData])

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      console.error("Error al agregar producto:", error)
      alert("Error al agregar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 space-y-6 border-2 border-[#0d2646]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="id">ID del Producto</Label>
          <Input id="id" name="id" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="nombre">Nombre del Producto</Label>
          <Input id="nombre" name="nombre" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="ubicacion">Ubicación</Label>
          <Input id="ubicacion" name="ubicacion" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="numero_lotes">Número de Lotes</Label>
          <Input id="numero_lotes" name="numero_lotes" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="tamano_lote">Tamaño del Lote</Label>
          <Input id="tamano_lote" name="tamano_lote" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="unidades">Unidades Totales</Label>
          <Input id="unidades" name="unidades" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="cantidad_disponible">Cantidad Disponible</Label>
          <Input id="cantidad_disponible" name="cantidad_disponible" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="fecha_expiracion">Fecha de Expiración</Label>
          <Input id="fecha_expiracion" name="fecha_expiracion" type="date" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="proveedores">Proveedores</Label>
          <Input id="proveedores" name="proveedores" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="umbral_minimo">Umbral Mínimo</Label>
          <Input id="umbral_minimo" name="umbral_minimo" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="umbral_maximo">Umbral Máximo</Label>
          <Input id="umbral_maximo" name="umbral_maximo" type="number" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="entrada">Tipo de Entrada</Label>
          <Input id="entrada" name="entrada" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="precio_compra">Precio de Compra</Label>
          <Input id="precio_compra" name="precio_compra" type="number" step="0.01" required className="mt-2" />
        </div>

        <div>
          <Label htmlFor="total_compra">Total de Compra</Label>
          <Input id="total_compra" name="total_compra" type="number" step="0.01" required className="mt-2" />
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

      <Button type="submit" disabled={isLoading} className="w-full bg-[#0d2646] hover:bg-[#213a55] text-white h-12">
        {isLoading ? "Agregando..." : "Agregar Producto"}
      </Button>
    </form>
  )
}
