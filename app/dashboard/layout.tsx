import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import DirectorSidebar from "@/components/director-sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {profile?.rol != "Director General" ? (
        <Sidebar profile={profile} />
      ) : (
        <DirectorSidebar profile={profile} company={company} />
      )}

      <main className="flex-1 ml-[280px] p-8">
        <Suspense
          fallback={
            <div className="size-full flex justify-center items-center">
              <Spinner className="size-8" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
