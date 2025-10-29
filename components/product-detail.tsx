"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  nombre: string;
  imagen_url: string | null;
  ubicacion: string;
  tamano_lote: number;
  cantidad_disponible: number;
  fecha_expiracion: string;
  proveedores: string;
  umbral_minimo: number;
  umbral_maximo: number;
  precio_compra: number;
  total_compra: number;
  numero_lotes: number;
  unidades: number;
}

interface Movement {
  tipo_movimiento: string;
  unidades: number;
  fecha_movimiento: string;
  precio_venta: number;
  ganancia: number;
}

interface Transfer {
  sede_origen: string;
  destino: string;
  fecha: string;
  motivo: string;
  encargado: string;
}

interface ProductDetailProps {
  product: Product;
  movements: Movement[];
  transfers: Transfer[];
}

export default function ProductDetail({
  product,
  movements,
  transfers,
}: ProductDetailProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product.imagen_url
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Solicitud de reabastecimiento
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number | string>("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Confirmación de eliminación
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Mensajes
  const [message, setMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);

      let imageUrl = product.imagen_url;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          imageUrl = url;
        }
      }

      const productData = {
        nombre: formData.get("nombre") as string,
        ubicacion: formData.get("ubicacion") as string,
        numero_lotes: Number.parseInt(formData.get("numero_lotes") as string),
        tamano_lote: Number.parseInt(formData.get("tamano_lote") as string),
        unidades: Number.parseInt(formData.get("unidades") as string),
        cantidad_disponible: Number.parseInt(
          formData.get("cantidad_disponible") as string
        ),
        fecha_expiracion: formData.get("fecha_expiracion") as string,
        proveedores: formData.get("proveedores") as string,
        entrada: formData.get("entrada") as string,
        precio_compra: Number.parseFloat(
          formData.get("precio_compra") as string
        ),
        total_compra: Number.parseFloat(formData.get("total_compra") as string),
        imagen_url: imageUrl,
      };

      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", product.id);
      if (error) throw error;

      setIsEditOpen(false);
      setMessage("¡Producto actualizado con éxito!");
      toast({
        type: "success",
        title: "Producto actualizado",
        description: `El producto "${product.nombre}" ha sido actualizado.`,
      });
      router.refresh();
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setMessage("Error al actualizar el producto");
      toast({
        type: "error",
        title: "Error al actualizar el producto",
        description: err instanceof Error ? err.message : "Ocurrió un error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar producto
  const handleDelete = () => {
    setIsConfirmingDelete(true);
    setIsEditOpen(false);
  };

  const executeDelete = async () => {
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      if (error) throw error;
      router.push("/dashboard");
      toast({
        type: "success",
        title: "Producto eliminado",
        description: `El producto "${product.nombre}" ha sido eliminado.`,
      });
      router.refresh();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setMessage("Error al eliminar el producto. Por favor, intenta de nuevo.");
      toast({
        type: "error",
        title: "Error al eliminar el producto",
        description: err instanceof Error ? err.message : "Ocurrió un error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Enviar solicitud de reabastecimiento
  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const qty = Number(requestAmount);
    if (!Number.isInteger(qty) || qty <= 0) {
      setMessage("Ingrese una cantidad válida mayor a 0.");
      return;
    }
    if (!(product.cantidad_disponible <= product.umbral_minimo)) {
      setMessage("El stock no está bajo. No se puede enviar solicitud.");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        throw new Error("Usuario no autenticado. Por favor, inicia sesión.");

      // 1) Intentar RPC (función en la DB)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "request_restock_and_update",
        {
          p_product_id: product.id,
          p_qty: qty,
          p_requested_by: user.id,
        }
      );

      let newStock: number | null = null;
      if (rpcError) {
        console.warn(
          "RPC request_restock_and_update falló, se intentará fallback:",
          rpcError
        );
        // 2) Fallback: actualizar tabla products manualmente e insertar fila en restock_requests
        const currentStock = product.cantidad_disponible ?? 0;
        const calculated = currentStock + qty;
        const maxStock = product.umbral_maximo ?? calculated;
        newStock = Math.min(maxStock, calculated);

        const { error: updErr } = await supabase
          .from("products")
          .update({ cantidad_disponible: newStock })
          .eq("id", product.id);
        if (updErr) throw updErr;

        // intentar insertar solicitud de reabastecimiento (si existe la tabla)
        const { error: insertErr } = await supabase
          .from("restock_requests")
          .insert([
            {
              product_id: product.id,
              quantity: qty,
              requested_by: user.id,
            },
          ]);
        if (insertErr) {
          // no crítico: loguear pero no abortar el flujo de envío de correo
          console.warn(
            "No se pudo insertar restock_requests (puede que la tabla no exista):",
            insertErr
          );
        }
      } else {
        // rpcData puede ser un array o un objeto dependiendo de la función
        newStock = Array.isArray(rpcData)
          ? rpcData[0]?.cantidad_disponible ?? null
          : (rpcData as any)?.cantidad_disponible ?? null;
      }

      // 3) Invocar Edge Function para enviar correo - asegúrate de enviar body como JSON string
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "send-restock-email",
        {
          // Enviar objeto, no JSON.stringify
          body: {
            employeeEmail: user.email,
            employeeId: user.id,
            employeeName: user.user_metadata?.name ?? user.email ?? "Empleado",
            productName: product.nombre,
            productId: product.id,
            requestedAmount: qty,
            updatedStock: newStock ?? product.cantidad_disponible,
            previousStock: product.cantidad_disponible,
          },
        }
      );
      if (fnError) {
        console.warn("Error al invocar función send-restock-email:", fnError);
        setMessage(
          `Solicitud enviada pero no se pudo notificar por correo: ${
            fnError.message || "revisa logs"
          }`
        );
        toast({
          type: "warning",
          title: "Solicitud enviada con advertencia",
          description: `No se pudo notificar por correo: ${
            fnError.message || "revisa logs"
          }`,
        });
      } else {
        setMessage("¡Solicitud de reabastecimiento enviada con éxito!");
        toast({
          type: "success",
          title: "Solicitud enviada",
          description: `Se ha enviado una solicitud de reabastecimiento para "${product.nombre}".`,
        });
      }

      setIsRequestOpen(false);
      setRequestAmount("");
      router.refresh();
    } catch (err: any) {
      // mostrar info más útil en consola y en UI
      console.error(
        "Error al enviar la solicitud:",
        JSON.stringify(err, Object.getOwnPropertyNames(err))
      );
      setMessage(
        err?.message ??
          "Error al enviar la solicitud. Por favor, intenta de nuevo."
      );
      toast({
        type: "error",
        title: "Error al enviar la solicitud",
        description: err?.message ?? "Ocurrió un error",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const isLowStock = product.cantidad_disponible <= product.umbral_minimo;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0d2646] rounded-3xl p-8 text-white">
          <div className="bg-white rounded-2xl p-8 mb-6">
            {product.imagen_url ? (
              <Image
                src={product.imagen_url || "/placeholder.svg"}
                alt={product.nombre}
                width={400}
                height={400}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2 uppercase">
            {product.nombre}
          </h1>
          <p className="text-lg mb-6">ID: {product.id}</p>

          <div className="space-y-3 text-base">
            <p>
              <span className="font-semibold">Ubicación:</span>{" "}
              {product.ubicacion}
            </p>
            <p>
              <span className="font-semibold">Tamaño del Lote:</span>{" "}
              {product.tamano_lote.toLocaleString()} unidades
            </p>
            <p>
              <span className="font-semibold">Cantidad Disponible:</span>{" "}
              {product.cantidad_disponible.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Expiración:</span>{" "}
              {new Date(product.fecha_expiracion).toLocaleDateString("es-ES")}
            </p>
            <p>
              <span className="font-semibold">Proveedores:</span>{" "}
              {product.proveedores}
            </p>
            <p>
              <span className="font-semibold">Umbral Mínimo:</span>{" "}
              {product.umbral_minimo} unidades
            </p>
            <p>
              <span className="font-semibold">Umbral Máximo:</span>{" "}
              {product.umbral_maximo} unidades
            </p>
          </div>

          <Button
            onClick={() => setIsEditOpen(true)}
            className="mt-6 w-full bg-white text-[#0d2646] hover:bg-gray-100"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Producto
          </Button>

          {/* Botón visible solo con stock bajo (AC 1 y 2) */}
          {isLowStock && (
            <Button
              onClick={() => setIsRequestOpen(true)}
              className="mt-4 w-full bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
              aria-label="Solicitar reabastecimiento por stock bajo"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Solicitar Reabastecimiento
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* ... resto de tus tablas y resúmenes sin cambios ... */}
          {/* Ganancias y Traslados */}
          <div>
            <h2 className="text-2xl font-bold text-[#487fbb] mb-4">
              Resumen Inversión Inicial
            </h2>
            <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
              <table className="w-full">
                <thead className="bg-[#487fbb] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Entrada
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Nro Lotes
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Unidades
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Precio Compra
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Total Compra
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm">Inventario Inicial</td>
                    <td className="px-4 py-3 text-sm">
                      {product.numero_lotes}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {product.unidades.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ${product.precio_compra.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ${product.total_compra.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#487fbb] mb-4">
              Resumen de Ganancias
            </h2>
            <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
              <table className="w-full">
                <thead className="bg-[#487fbb] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Movimientos
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Unidades
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Fecha Movimiento
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Precio Venta
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Ganancias
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No hay movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    movements.map((movement, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm">
                          {movement.tipo_movimiento}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {movement.unidades.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(
                            movement.fecha_movimiento
                          ).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ${movement.precio_venta.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ${movement.ganancia.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#487fbb] mb-4">
              Resumen de Traslados
            </h2>
            <div className="bg-white rounded-xl overflow-hidden border-2 border-[#0d2646]">
              <table className="w-full">
                <thead className="bg-[#487fbb] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Sede Origen
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Destino
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Encargado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No hay traslados registrados
                      </td>
                    </tr>
                  ) : (
                    transfers.map((transfer, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm">
                          {transfer.sede_origen}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transfer.destino}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(transfer.fecha).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-sm">{transfer.motivo}</td>
                        <td className="px-4 py-3 text-sm">
                          {transfer.encargado}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Solicitar Reabastecimiento (AC 3) */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0d2646]">
              Solicitar Reabastecimiento
            </DialogTitle>
          </DialogHeader>
          <p className="pt-2">
            Estás solicitando reabastecimiento para{" "}
            <strong>{product.nombre}</strong>.
          </p>
          <p className="text-sm text-gray-600">
            Stock actual: {product.cantidad_disponible.toLocaleString()}{" "}
            (Umbral: {product.umbral_minimo.toLocaleString()})
          </p>
          <form onSubmit={handleRequestSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="requestAmount">Cantidad a Solicitar</Label>
              <Input
                id="requestAmount"
                name="requestAmount"
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Ej: 100"
                required
                className="mt-2"
                min={1}
              />
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRequestOpen(false)}
                className="flex-1"
                disabled={isSubmittingRequest}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingRequest}
                className="flex-1 bg-[#0d2646] hover:bg-[#213a55] text-white"
              >
                {isSubmittingRequest ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edición y eliminación ya existentes */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0d2646]">
              Editar Producto
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... campos existentes ... */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1"
                disabled={isLoading || isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isDeleting}
                className="flex-1 bg-[#0d2646] hover:bg-[#213a55] text-white"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <p className="py-2">
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>"{product.nombre}"</strong>?
          </p>
          <p className="font-medium text-red-600">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={executeDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de mensajes */}
      <Dialog open={!!message} onOpenChange={() => setMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0d2646]">
              Notificación
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">{message}</p>
          <Button
            onClick={() => setMessage(null)}
            className="w-full bg-[#0d2646] hover:bg-[#213a55] text-white"
          >
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
