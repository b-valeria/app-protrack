import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/sidebar"
import ProductDetail from "@/components/product-detail"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("user_id", data.user.id)
    .single()

  if (!product) {
    redirect("/dashboard")
  }

  const { data: movements } = await supabase
    .from("movements")
    .select("*")
    .eq("product_id", id)
    .eq("user_id", data.user.id)
    .order("fecha_movimiento", { ascending: false })

  const { data: transfers } = await supabase
    .from("transfers")
    .select("*")
    .eq("product_id", id)
    .eq("user_id", data.user.id)
    .order("fecha", { ascending: false })

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar profile={profile} />

      <main className="flex-1 ml-[280px] p-8">
        <ProductDetail product={product} movements={movements || []} transfers={transfers || []} />
      </main>
    </div>
  )
}
