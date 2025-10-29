import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "@/components/product-detail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) redirect("/dashboard");

  const { data: movements } = await supabase
    .from("movements")
    .select("*")
    .eq("product_id", id)
    .order("fecha_movimiento", { ascending: false });

  const { data: transfers } = await supabase
    .from("transfers")
    .select("*")
    .eq("product_id", id)
    .order("fecha", { ascending: false });

  return (
    <ProductDetail
      product={product}
      movements={movements || []}
      transfers={transfers || []}
    />
  );
}
