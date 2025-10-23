import { redirect } from "next/navigation"
import { createClient } from "../../../../lib/supabase/server"
import DirectorSidebar from "../../../../components/director-sidebar"
import DirectorStaff from "../../../../components/director-staff"

export default async function DirectorStaffPage() {
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

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <DirectorSidebar profile={profile} company={company} />

      <main className="flex-1 ml-[280px] p-8">
        <DirectorStaff staff={staff || []} companyId={profile.company_id} />
      </main>
    </div>
  )
}
