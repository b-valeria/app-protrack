import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/sidebar"
import AddProductForm from "@/components/add-product-form"

export default async function AddProductPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar profile={profile} />

      <main className="flex-1 ml-[280px] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0d2646] mb-8">Agregar Producto</h1>
          <AddProductForm userId={data.user.id} />
        </div>
      </main>
    </div>
  )
}
