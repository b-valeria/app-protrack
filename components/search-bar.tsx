"use client"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Search, Filter, Grid, Plus } from "lucide-react"
import Link from "next/link"

export default function SearchBar() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d2646]" />
        <Input
          type="search"
          placeholder="Buscar productos..."
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

      <Link href="/dashboard/add-product">
        <Button className="h-12 px-6 bg-[#0d2646] text-white rounded-full hover:bg-[#213a55]">
          <Plus className="w-5 h-5 mr-2" />
          Agregar Producto
        </Button>
      </Link>
    </div>
  )
}
