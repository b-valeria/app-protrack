import { redirect } from "next/navigation"
import { createClient } from "../../../../lib/supabase/server"
import DirectorSidebar from "../../../../components/director-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"

export default async function DirectorSettingsPage() {
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

  const { data: warehouses } = await supabase.from("warehouses").select("*").eq("company_id", profile.company_id)

  const { data: abcCategories } = await supabase.from("abc_categories").select("*").eq("company_id", profile.company_id)

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <DirectorSidebar profile={profile} company={company} />

      <main className="flex-1 ml-[280px] p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
            <p className="text-gray-600 mt-2">Gestiona la configuración de tu empresa</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Detalles de tu empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <p className="text-lg">{company?.nombre}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sedes / Almacenes</CardTitle>
              <CardDescription>Ubicaciones de tu empresa ({warehouses?.length || 0})</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {warehouses?.map((warehouse) => (
                  <div key={warehouse.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{warehouse.nombre}</span>
                    <span className="text-sm text-gray-600">Capacidad: {warehouse.capacidad_maxima}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorías ABC</CardTitle>
              <CardDescription>Configuración de categorías de rotación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {abcCategories?.map((category) => (
                  <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      Categoría {category.categoria} - {category.nombre}
                    </span>
                    <span className="text-sm text-gray-600">
                      ${category.precio_minimo} - ${category.precio_maximo}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
