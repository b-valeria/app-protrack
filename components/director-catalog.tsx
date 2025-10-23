"use client"

import { useState, useMemo } from "react"
import SearchBar from "@/components/search-bar"
import ProductGrid from "@/components/product-grid"

interface Product {
  id: string
  nombre: string
  ubicacion: string
  numero_lotes: number
  tamano_lote: number
  unidades: number
  cantidad_disponible: number
  fecha_expiracion: string
  proveedores: string
  umbral_minimo: number
  umbral_maximo: number
  entrada: string
  precio_compra: number
  total_compra: number
  imagen_url?: string
  user_id?: string
  created_at?: string
  categoria_abc?: string
  warehouse_id?: string
}

interface Warehouse {
  id: string
  nombre: string
  capacidad_maxima: number
  company_id: string
}

interface DirectorCatalogProps {
  products: Product[]
  companyId: string
  warehouses: Warehouse[]
  userId: string
}

export default function DirectorCatalog({ products, companyId, warehouses, userId }: DirectorCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    const query = searchQuery.toLowerCase()
    return products.filter((product) => product.nombre.toLowerCase().includes(query))
  }, [products, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
        <p className="text-sm text-gray-600 mt-1">Gestiona tu inventario y edita umbrales mínimos y máximos</p>
      </div>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        addProductLink="/dashboard/director/add-product"
        showImportCSV={true}
        companyId={companyId}
        userId={userId}
      />

      <ProductGrid products={filteredProducts} />
    </div>
  )
}
