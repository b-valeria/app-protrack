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
}

interface DashboardContentProps {
  products: Product[]
}

export default function DashboardContent({ products }: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    const query = searchQuery.toLowerCase()
    return products.filter((product) => product.nombre.toLowerCase().includes(query))
  }, [products, searchQuery])

  return (
    <>
      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <ProductGrid products={filteredProducts} />
    </>
  )
}
