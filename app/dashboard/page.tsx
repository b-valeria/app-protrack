import { redirect } from "next/navigation"
import { createClient } from "../../lib/supabase/server"
import Sidebar from "../../components/sidebar"
import DashboardContent from "../../components/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar profile={profile} />

      <main className="flex-1 ml-[280px] p-8">
        <DashboardContent products={products || []} />
      </main>
    </div>
  )
}


