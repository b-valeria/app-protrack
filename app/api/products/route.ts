import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"


export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
 try {
   const { id } = await params
   const cookieStore = await cookies()


   const supabase = createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     {
       cookies: {
         getAll() {
           return cookieStore.getAll()
         },
         setAll(cookiesToSet) {
           cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
         },
       },
     },
   )


   // Verificar autenticación
   const {
     data: { user },
   } = await supabase.auth.getUser()


   if (!user) {
     return NextResponse.json({ error: "No autorizado" }, { status: 401 })
   }


   // Eliminar el producto de la base de datos
   const { error } = await supabase.from("products").delete().eq("id", id)


   if (error) {
     console.error("[v0] Error al eliminar producto:", error)
     return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
   }


   return NextResponse.json({ success: true })
 } catch (error) {
   console.error("[v0] Error en DELETE /api/products/[id]:", error)
   return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
 }
}
