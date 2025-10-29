import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DirectorStaff from "@/components/director-staff";

export default async function DirectorStaffPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  return <DirectorStaff staff={staff || []} companyId={profile.company_id} />;
}
