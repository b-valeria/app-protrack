
// @ts-ignore Remote module resolved by Deno runtime.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
// @ts-ignore Remote module resolved by Deno runtime.
import { Resend } from "https://esm.sh/v135/resend@2.0.0"

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

interface Payload {
  employeeEmail: string
  employeeId: string
  employeeName: string
  productName: string
  productId: string
  requestedAmount: number
  updatedStock: number
  previousStock: number
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "re_e9sGwX6e_HFTN6HsBqmUsPnQHJ8kei1XA")

serve(async (req: Request): Promise<Response> => {
  try {
    const payload: Payload = await req.json()
    const adminEmail = Deno.env.get("ADMIN_EMAIL")
    const from = Deno.env.get("RESEND_FROM") ?? "28155305@correo.unimet.edu.ve"
    if (!adminEmail) throw new Error("ADMIN_EMAIL no-configurado")

    await resend.emails.send({
      from,
      to: [adminEmail],
      subject: `Solicitud de reabastecimiento: ${payload.productName}`,
      html: `
        <h1>Alerta de Stock Bajo</h1>
        <p>El empleado <strong>${payload.employeeName}</strong> (${payload.employeeEmail}) ha solicitado reabastecimiento.</p>
        <ul>
          <li><strong>Producto:</strong> ${payload.productName} (${payload.productId})</li>
          <li><strong>Cantidad solicitada:</strong> ${payload.requestedAmount}</li>
          <li><strong>Stock anterior:</strong> ${payload.previousStock}</li>
          <li><strong>Stock actualizado:</strong> ${payload.updatedStock}</li>
          <li><strong>ID de empleado:</strong> ${payload.employeeId}</li>
        </ul>
      `,
    })

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("send-restock-email:", error instanceof Error ? error : { error })
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})