"use client";

import type React from "react";
import { createClient } from "../../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Warehouse {
  nombre: string;
  capacidad_maxima: string;
}

export default function DirectorSignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    { nombre: "", capacidad_maxima: "" },
  ]);
  const [categoriaA, setCategoriaA] = useState({ min: "", max: "" });
  const [categoriaB, setCategoriaB] = useState({ min: "", max: "" });
  const [categoriaC, setCategoriaC] = useState({ min: "", max: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("Al menos una letra mayúscula");
    if (!/[0-9]/.test(pwd)) errors.push("Al menos un número");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("Al menos un símbolo");
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordErrors(validatePassword(newPassword));
  };

  const addWarehouse = () => {
    setWarehouses([...warehouses, { nombre: "", capacidad_maxima: "" }]);
  };

  const removeWarehouse = (index: number) => {
    if (warehouses.length > 1) {
      setWarehouses(warehouses.filter((_, i) => i !== index));
    }
  };

  const updateWarehouse = (
    index: number,
    field: keyof Warehouse,
    value: string
  ) => {
    const updated = [...warehouses];
    updated[index][field] = value;
    setWarehouses(updated);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError("La contraseña no cumple con los requisitos de seguridad");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("[v0] Iniciando registro de Director General...");

      // 1. Crear usuario en Supabase Auth
      console.log("[v0] Paso 1: Creando usuario en Auth...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/director`,
          data: {
            nombre: nombre,
            telefono: telefono,
            rol: "Director General",
          },
        },
      });

      if (authError) {
        console.error("[v0] Error en Auth:", {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });
        throw new Error(`Error de autenticación: ${authError.message}`);
      }
      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }
      console.log("[v0] Usuario creado exitosamente:", authData.user.id);

      // 2. Crear empresa
      console.log("[v0] Paso 2: Creando empresa...");
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({ nombre: nombreEmpresa })
        .select()
        .single();

      if (companyError) {
        console.error("[v0] Error al crear empresa:", {
          message: companyError.message,
          code: companyError.code,
          details: companyError.details,
          hint: companyError.hint,
        });
        throw new Error(`Error al crear empresa: ${companyError.message}`);
      }
      if (!companyData) {
        throw new Error("No se pudo crear la empresa");
      }
      console.log("[v0] Empresa creada:", companyData.id);

      // 3. Crear sedes
      console.log("[v0] Paso 3: Creando sedes...");
      const warehousesData = warehouses.map((w) => ({
        company_id: companyData.id,
        nombre: w.nombre,
        capacidad_maxima: Number.parseInt(w.capacidad_maxima),
      }));

      const { error: warehousesError } = await supabase
        .from("warehouses")
        .insert(warehousesData);

      if (warehousesError) {
        console.error("[v0] Error al crear sedes:", {
          message: warehousesError.message,
          code: warehousesError.code,
          details: warehousesError.details,
          hint: warehousesError.hint,
        });
        throw new Error(`Error al crear sedes: ${warehousesError.message}`);
      }
      console.log("[v0] Sedes creadas exitosamente");

      // 4. Crear categorías ABC por defecto
      console.log("[v0] Paso 4: Creando categorías ABC...");
      const categoriesData = [
        {
          company_id: companyData.id,
          categoria: "A",
          nombre: "Categoría A",
          precio_minimo: Number.parseFloat(categoriaA.min) || 0,
          precio_maximo: Number.parseFloat(categoriaA.max) || 0,
        },
        {
          company_id: companyData.id,
          categoria: "B",
          nombre: "Categoría B",
          precio_minimo: Number.parseFloat(categoriaB.min) || 0,
          precio_maximo: Number.parseFloat(categoriaB.max) || 0,
        },
        {
          company_id: companyData.id,
          categoria: "C",
          nombre: "Categoría C",
          precio_minimo: Number.parseFloat(categoriaC.min) || 0,
          precio_maximo: Number.parseFloat(categoriaC.max) || 0,
        },
      ];

      const { error: categoriesError } = await supabase
        .from("abc_categories")
        .insert(categoriesData);

      if (categoriesError) {
        console.error("[v0] Error al crear categorías:", {
          message: categoriesError.message,
          code: categoriesError.code,
          details: categoriesError.details,
          hint: categoriesError.hint,
        });
        throw new Error(
          `Error al crear categorías ABC: ${categoriesError.message}`
        );
      }
      console.log("[v0] Categorías ABC creadas exitosamente");

      // 5. Crear perfil del Director General
      console.log("[v0] Paso 5: Creando perfil...");
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        nombre: nombre,
        email: email,
        telefono: telefono,
        rol: "Director General",
        posicion: "Director General",
        company_id: companyData.id,
      });

      if (profileError) {
        console.error("[v0] Error al crear perfil:", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        });
        throw new Error(`Error al crear perfil: ${profileError.message}`);
      }
      console.log("[v0] Perfil creado exitosamente");

      setSuccess(
        "¡Cuenta creada exitosamente! Por favor revisa tu correo para confirmar tu cuenta."
      );
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error: unknown) {
      toast({
        type: "error",
        title: "Error en el registro",
        description:
          error instanceof Error ? error.message : "Ocurrió un error",
      });
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al crear la cuenta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToStep2 =
    nombre && email && telefono && password && passwordErrors.length === 0;
  const canProceedToStep3 =
    nombreEmpresa && warehouses.every((w) => w.nombre && w.capacidad_maxima);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PROTRACK</h1>
            <p className="mt-2 text-sm text-gray-600">
              Registro de Director General
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Datos Personales</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Empresa y Sedes</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Categorías ABC</span>
            </div>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Step 1: Datos Personales */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Datos Personales
                  </h2>

                  <div>
                    <label
                      htmlFor="nombre"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre Completo *
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="telefono"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Teléfono *
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Correo Electrónico *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Contraseña *
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-700">
                        La contraseña debe tener:
                      </p>
                      <ul className="text-xs space-y-1">
                        <li
                          className={
                            password.length >= 8
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(password)
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          {/[A-Z]/.test(password) ? "✓" : "○"} Al menos una
                          letra mayúscula
                        </li>
                        <li
                          className={
                            /[0-9]/.test(password)
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          {/[0-9]/.test(password) ? "✓" : "○"} Al menos un
                          número
                        </li>
                        <li
                          className={
                            /[!@#$%^&*(),.?":{}|<>]/.test(password)
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"}{" "}
                          Al menos un símbolo
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continuar
                  </button>
                </>
              )}

              {/* Step 2: Empresa y Sedes */}
              {currentStep === 2 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Empresa y Sedes
                  </h2>

                  <div>
                    <label
                      htmlFor="nombreEmpresa"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre de la Empresa *
                    </label>
                    <input
                      id="nombreEmpresa"
                      type="text"
                      required
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Sedes / Almacenes *
                      </label>
                      <button
                        type="button"
                        onClick={addWarehouse}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Sede
                      </button>
                    </div>

                    <div className="space-y-3">
                      {warehouses.map((warehouse, index) => (
                        <div
                          key={index}
                          className="flex gap-3 items-start p-3 border border-gray-200 rounded-md"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Nombre de la sede"
                              required
                              value={warehouse.nombre}
                              onChange={(e) =>
                                updateWarehouse(index, "nombre", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            />
                            <input
                              type="number"
                              placeholder="Capacidad máxima"
                              required
                              min="1"
                              value={warehouse.capacidad_maxima}
                              onChange={(e) =>
                                updateWarehouse(
                                  index,
                                  "capacidad_maxima",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {warehouses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWarehouse(index)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Categorías ABC */}
              {currentStep === 3 && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Configuración de Categorías ABC
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Define los rangos de precio para cada categoría. Podrás
                    agregar categorías personalizadas después.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Categoría A (Alta rotación)
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Mínimo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaA.min}
                            onChange={(e) =>
                              setCategoriaA({
                                ...categoriaA,
                                min: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Máximo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaA.max}
                            onChange={(e) =>
                              setCategoriaA({
                                ...categoriaA,
                                max: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Categoría B (Rotación media)
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Mínimo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaB.min}
                            onChange={(e) =>
                              setCategoriaB({
                                ...categoriaB,
                                min: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Máximo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaB.max}
                            onChange={(e) =>
                              setCategoriaB({
                                ...categoriaB,
                                max: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Categoría C (Baja rotación)
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Mínimo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaC.min}
                            onChange={(e) =>
                              setCategoriaC({
                                ...categoriaC,
                                min: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Precio Máximo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={categoriaC.max}
                            onChange={(e) =>
                              setCategoriaC({
                                ...categoriaC,
                                max: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
