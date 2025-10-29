import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import DirectorSidebar from "../../../components/director-sidebar";
import DirectorDashboardContent from "../../../components/director-dashboard-content";

export default async function DirectorDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  // Obtener datos de la empresa
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
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
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <DirectorSidebar profile={profile} company={company} />

      <main className="flex-1 ml-[280px] p-8">
        <DirectorDashboardContent
          products={products || []}
          staff={staff || []}
          warehouses={warehouses || []}
          companyId={profile.company_id}
        />
      </main>
    </div>
  );
}
