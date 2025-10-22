"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

interface ProfileFormProps {
  profile: {
    nombre: string
    rol: string
    foto_url: string | null
    posicion?: string | null
    email?: string | null
    telefono?: string | null
  } | null
  userId: string
  userEmail: string
}

export default function ProfileForm({ profile, userId, userEmail }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(profile?.foto_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no puede superar 5MB")
        return
      }

      setImageFile(file)
      setError(null)
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
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      let imageUrl = profile?.foto_url
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "Error al subir la imagen")
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const profileData = {
        nombre: formData.get("nombre") as string,
        rol: formData.get("rol") as string,
        posicion: formData.get("posicion") as string,
        email: userEmail,
        telefono: formData.get("telefono") as string,
        foto_url: imageUrl,
      }

      const { error: updateError } = await supabase.from("profiles").update(profileData).eq("id", userId)

      if (updateError) {
        throw updateError
      }

      router.refresh()
      alert("Perfil actualizado correctamente")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el perfil"
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 space-y-6 border-2 border-[#0d2646]">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#0d2646] overflow-hidden bg-gray-100 mb-4">
          {imagePreview ? (
            <Image
              src={imagePreview || "/placeholder.svg"}
              alt="Foto de perfil"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#0d2646]">
              {profile?.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <Label htmlFor="foto" className="cursor-pointer">
          <div className="px-4 py-2 bg-[#487fbb] text-white rounded-lg hover:bg-[#213a55] transition-colors">
            Cambiar Foto
          </div>
          <Input id="foto" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </Label>
        {imageFile && <p className="text-sm text-gray-600 mt-2">Archivo seleccionado: {imageFile.name}</p>}
      </div>

      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" defaultValue={profile?.nombre} required className="mt-2" />
      </div>

      <div>
        <Label htmlFor="posicion">Posición</Label>
        <Input id="posicion" name="posicion" defaultValue={profile?.posicion || ""} className="mt-2" />
      </div>

      <div>
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={userEmail}
          disabled
          className="mt-2 bg-gray-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">El correo no se puede modificar</p>
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          defaultValue={profile?.telefono || ""}
          placeholder="+52 123 456 7890"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="rol">Rol</Label>
        <Input id="rol" name="rol" defaultValue={profile?.rol} required className="mt-2" />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-[#0d2646] hover:bg-[#213a55] text-white h-12">
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  )
}

