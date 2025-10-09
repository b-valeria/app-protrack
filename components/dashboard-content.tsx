"use client"

import { useState, useMemo } from "react"
import SearchBar from "./search-bar"
import ProductGrid from "./product-grid"
import filterProducts, { type Product as ProductType } from "@/lib/filters"
import { Product as SharedProduct } from "@/lib/types"

interface DashboardContentProps {
  products: SharedProduct[]
}

export default function DashboardContent({ products }: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [codigoBarras, setCodigoBarras] = useState("")
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [stockMin, setStockMin] = useState<number | undefined>(undefined)
  const [stockMax, setStockMax] = useState<number | undefined>(undefined)
  const [sortBy, setSortBy] = useState<"precio_compra" | "created_at" | "updated_at" | "nombre" | "">("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const filteredProducts = useMemo(() => {
    return filterProducts(products as ProductType[], {
      query: searchQuery,
      codigoBarras: codigoBarras || undefined,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
      sortBy: sortBy || undefined,
      sortOrder,
    })
  }, [products, searchQuery, codigoBarras, priceMin, priceMax, stockMin, stockMax, sortBy, sortOrder])

  const gridProducts: SharedProduct[] = filteredProducts.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    imagen_url: p.imagen_url ?? null,
    cantidad_disponible: typeof p.cantidad_disponible === 'number' ? p.cantidad_disponible : 0,
    ubicacion: p.ubicacion ?? '',
  }))

  return (
    <>
      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Código de barras</label>
          <input value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} className="ml-2 px-2 py-1 border rounded" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Precio min</label>
          <input type="number" value={priceMin ?? ""} onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)} className="ml-2 px-2 py-1 border rounded w-32" />
          <label className="text-sm ml-4">Precio max</label>
          <input type="number" value={priceMax ?? ""} onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)} className="ml-2 px-2 py-1 border rounded w-32" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Stock min</label>
          <input type="number" value={stockMin ?? ""} onChange={(e) => setStockMin(e.target.value ? Number(e.target.value) : undefined)} className="ml-2 px-2 py-1 border rounded w-28" />
          <label className="text-sm ml-4">Stock max</label>
          <input type="number" value={stockMax ?? ""} onChange={(e) => setStockMax(e.target.value ? Number(e.target.value) : undefined)} className="ml-2 px-2 py-1 border rounded w-28" />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label>Ordenar por:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 border rounded">
          <option value="">--</option>
          <option value="precio_compra">Precio</option>
          <option value="created_at">Fecha creación</option>
          <option value="updated_at">Fecha actualización</option>
          <option value="nombre">Nombre</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="px-2 py-1 border rounded">
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
      </div>
  <ProductGrid products={gridProducts} />
    </>
  )
}
