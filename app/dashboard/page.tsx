import { createClient } from "@/lib/supabase/server";
import DashboardContent from "@/components/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return <DashboardContent products={products || []} />;
}
