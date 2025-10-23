"use client"

import { useState, useMemo } from "react"
import SearchBar from "./search-bar"
import ProductGrid from "./product-grid"

interface Product {
  id: string
  nombre: string
  imagen_url: string | null
  cantidad_disponible: number
  ubicacion: string
  umbral_minimo: number
  umbral_maximo: number
}

interface Warehouse {
  id: string
  nombre: string
}

interface DirectorCatalogProps {
  products: Product[]
  companyId: string
  warehouses: Warehouse[]
}

export default function DirectorCatalog({ products, companyId, warehouses }: DirectorCatalogProps) {
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
      />

      <ProductGrid products={filteredProducts} />
    </div>
  )
}
