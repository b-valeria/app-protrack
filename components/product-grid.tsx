"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Product {
  id: string
  nombre: string
  imagen_url: string | null
  cantidad_disponible: number
  ubicacion: string
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const pathname = usePathname()
  const isDirectorDashboard = pathname?.startsWith("/dashboard/director")
  const productBaseUrl = isDirectorDashboard ? "/dashboard/director/product" : "/dashboard/product"

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay productos en el catálogo. Agrega tu primer producto.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`${productBaseUrl}/${product.id}`}>
          <div className="bg-white border-4 border-[#0d2646] rounded-3xl p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="aspect-square bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              {product.imagen_url ? (
                <Image
                  src={product.imagen_url || "/placeholder.svg"}
                  alt={product.nombre}
                  width={200}
                  height={200}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>
            <h3 className="text-center font-semibold text-[#0d2646] text-sm">{product.nombre}</h3>
            <p className="text-center text-xs text-gray-600 mt-1">{product.cantidad_disponible} unidades</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
