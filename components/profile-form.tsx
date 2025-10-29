"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormProps {
  profile: {
    nombre: string;
    rol: string;
    foto_url: string | null;
    telefono: string;
    email: string;
  };
  userId: string;
}

export default function ProfileForm({ profile, userId }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    profile.foto_url
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ email?: string; telefono?: string }>(
    {}
  );
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateTelefono = (telefono: string) => {
    const regex = /^\+?\d{7,15}$/;
    return regex.test(telefono);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const rol = formData.get("rol") as string;
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;

    const newErrors: typeof errors = {};
    if (!validateEmail(email)) newErrors.email = "Correo inválido";
    if (!validateTelefono(telefono)) newErrors.telefono = "Teléfono inválido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      let imageUrl = profile.foto_url;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          imageUrl = url;
        }
      }

      const profileData = { nombre, rol, email, telefono, foto_url: imageUrl };
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId);
      if (error) throw error;
      toast({
        type: "success",
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente.",
      });
      router.refresh();
    } catch (error) {
      toast({
        type: "error",
        title: "Error al actualizar el perfil",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
      });
      console.error("Error al actualizar el perfil: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-8 space-y-6 border-2 border-[#0d2646]"
    >
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#0d2646] overflow-hidden bg-gray-100 mb-4">
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Foto de perfil"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#0d2646]">
              {profile.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <Label htmlFor="foto" className="cursor-pointer">
          <div className="px-4 py-2 bg-[#487fbb] text-white rounded-lg hover:bg-[#213a55] transition-colors">
            Cambiar Foto
          </div>
          <Input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </Label>
      </div>

      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={profile.nombre}
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="rol">Rol</Label>
        <Input
          id="rol"
          name="rol"
          defaultValue={profile.rol}
          required
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={profile.email}
          placeholder="ejemplo@correo.com"
          required
          className={`mt-2 ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          defaultValue={profile.telefono}
          placeholder="+58 424 1234567"
          className={`mt-2 ${errors.telefono ? "border-red-500" : ""}`}
        />
        {errors.telefono && (
          <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#0d2646] hover:bg-[#213a55] text-white h-12"
      >
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
