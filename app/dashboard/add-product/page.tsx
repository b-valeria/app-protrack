import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddProductForm from "@/components/add-product-form";

export default async function AddProductPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/auth/login");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#0d2646] mb-8">
        Agregar Producto
      </h1>
      <AddProductForm userId={data.user.id} />
    </div>
  );
}
