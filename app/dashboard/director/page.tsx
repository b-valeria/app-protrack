import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DirectorDashboardContent from "@/components/director-dashboard-content";

export default async function DirectorDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  // Obtener productos de la empresa
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Obtener empleados de la empresa
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  // Obtener sedes
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .eq("company_id", profile.company_id);

  return (
    <DirectorDashboardContent
      products={products || []}
      staff={staff || []}
      warehouses={warehouses || []}
      companyId={profile.company_id}
    />
  );
}
