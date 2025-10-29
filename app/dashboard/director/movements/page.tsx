import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DirectorMovements from "@/components/director-movements";

export default async function DirectorMovementsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .eq("company_id", profile.company_id);

  return (
    <DirectorMovements
      companyId={profile.company_id}
      warehouses={warehouses || []}
    />
  );
}
