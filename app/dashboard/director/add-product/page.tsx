import { redirect } from "next/navigation"
import { createClient } from "../../../../lib/supabase/server"
import DirectorSidebar from "../../../../components/director-sidebar"
import AddProductForm from "../../../../components/add-product-form"

export default async function DirectorAddProductPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  if (profile?.rol !== "Director General") {
    redirect("/dashboard")
  }

  const { data: company } = await supabase.from("companies").select("*").eq("id", profile.company_id).single()

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <DirectorSidebar profile={profile} company={null} />

      <main className="flex-1 ml-[280px] p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Agregar Producto</h1>
          <AddProductForm userId={""} />
        </div>
      </main>
    </div>
  )
}
