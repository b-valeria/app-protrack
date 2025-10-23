"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Search, Filter, Grid, Plus, Upload, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importProductsFromCSV } from "@/app/actions/import-products-csv"
import { useRouter } from "next/navigation"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  addProductLink?: string
  showImportCSV?: boolean
  companyId?: string
  userId?: string
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  addProductLink = "/dashboard/add-product",
  showImportCSV = false,
  companyId,
  userId,
}: SearchBarProps) {
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      alert("Por favor selecciona un archivo CSV")
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("companyId", companyId || "")
      formData.append("userId", userId || "")

      const result = await importProductsFromCSV(formData)

      if (result.success) {
        alert(
          `Importación exitosa: ${result.data.imported} productos importados${
            result.data.errors ? `\n\nAdvertencias: ${result.data.errors.join(", ")}` : ""
          }`,
        )
        router.refresh()
      } else {
        alert(`Error al importar: ${result.error}`)
      }
    } catch (error) {
      console.error("Error importing CSV:", error)
      alert("Error al importar el archivo CSV")
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownloadTemplate = () => {
    const headers = [
      "id",
      "nombre",
      "ubicacion",
      "numero_lotes",
      "tamano_lote",
      "unidades",
      "cantidad_disponible",
      "fecha_expiracion",
      "proveedores",
      "umbral_minimo",
      "umbral_maximo",
      "entrada",
      "precio_compra",
      "total_compra",
      "imagen_url",
      "categoria_abc",
    ]

    const exampleRow = [
      "PROD-001",
      "Producto Ejemplo",
      "Almacén A",
      "5",
      "100",
      "500",
      "500",
      "2025-12-31",
      "Proveedor XYZ",
      "50",
      "1000",
      "Compra inicial",
      "10.50",
      "5250.00",
      "",
      "A",
    ]

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla_productos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d2646]" />
        <Input
          type="search"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 bg-white border-2 border-[#0d2646] rounded-full text-[#0d2646] placeholder:text-gray-500"
        />
      </div>

      <Button
        variant="outline"
        className="h-12 px-6 bg-white border-2 border-[#0d2646] text-[#0d2646] rounded-full hover:bg-[#0d2646] hover:text-white"
      >
        <Filter className="w-5 h-5 mr-2" />
        Crear Filtro
      </Button>

      <Button
        variant="outline"
        className="h-12 px-6 bg-white border-2 border-[#0d2646] text-[#0d2646] rounded-full hover:bg-[#0d2646] hover:text-white"
      >
        <Grid className="w-5 h-5 mr-2" />
        Crear Categoría
      </Button>

      {showImportCSV && (
        <>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="h-12 px-6 bg-white border-2 border-green-600 text-green-600 rounded-full hover:bg-green-600 hover:text-white"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar Plantilla
          </Button>

          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
            className="h-12 px-6 bg-white border-2 border-[#0d2646] text-[#0d2646] rounded-full hover:bg-[#0d2646] hover:text-white disabled:opacity-50"
          >
            <Upload className="w-5 h-5 mr-2" />
            {isImporting ? "Importando..." : "Importar CSV"}
          </Button>
        </>
      )}

      <Link href={addProductLink}>
        <Button className="h-12 px-6 bg-[#0d2646] text-white rounded-full hover:bg-[#213a55]">
          <Plus className="w-5 h-5 mr-2" />
          Agregar Producto
        </Button>
      </Link>
    </div>
  )
}
