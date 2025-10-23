import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/sidebar"
import ProfileForm from "@/components/profile-form"

export default async function ProfilePage() {
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
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0d2646] mb-8">Mi Perfil</h1>
          <ProfileForm profile={profile} userId={data.user.id} userEmail={data.user.email || ""} />
        </div>
      </main>
    </div>
  )
}

