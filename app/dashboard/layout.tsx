import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

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

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar profile={profile} />

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
