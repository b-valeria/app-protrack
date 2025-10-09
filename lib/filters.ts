export interface Product {
  id: string
  nombre: string
  imagen_url?: string | null
  cantidad_disponible?: number
  ubicacion?: string
  precio_compra?: number
  created_at?: string
  updated_at?: string
  // opcional: si quieres usar código de barras, añade `codigo_barras` a la tabla y a esta interfaz
  codigo_barras?: string
  [key: string]: any
}

export type SortBy = "precio_compra" | "created_at" | "updated_at" | "nombre"
export type SortOrder = "asc" | "desc"

export type ProductFilterOpts = {
  query?: string // búsqueda por nombre
  codigoBarras?: string // búsqueda exacta por código de barras (si existe campo)
  priceMin?: number
  priceMax?: number
  stockMin?: number
  stockMax?: number
  sortBy?: SortBy
  sortOrder?: SortOrder
}

/**
 * Filtra y ordena una lista de productos según opciones.
 * - Búsqueda por `query` en `nombre` (case-insensitive, partial match).
 * - Búsqueda por `codigoBarras` exacta si existe la propiedad `codigo_barras`.
 * - Rango de precio por `precio_compra` (min/max).
 * - Rango de stock por `cantidad_disponible` (min/max).
 * - Ordenamiento por `sortBy` y `sortOrder`.
 *
 * Nota: Si tu tabla no tiene `codigo_barras` o `updated_at`, puedes añadir esas columnas a la tabla
 * o mapear `codigo_barras` a `id` si corresponde.
 */
export function filterProducts(products: Product[], opts: ProductFilterOpts = {}) {
  const {
    query,
    codigoBarras,
    priceMin,
    priceMax,
    stockMin,
    stockMax,
    sortBy,
    sortOrder = "asc",
  } = opts

  let result = products.slice()

  // Filter by codigo de barras (exact match) if provided
  if (codigoBarras && codigoBarras.trim()) {
    const cb = codigoBarras.trim()
    result = result.filter((p) => {
      if (typeof p.codigo_barras === "string") return p.codigo_barras === cb
      // fallback: try matching id
      return p.id === cb
    })
  }

  // Filter by name query (partial, case-insensitive)
  if (query && query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter((p) => (p.nombre || "").toString().toLowerCase().includes(q))
  }

  // Price range
  if (typeof priceMin === "number") {
    result = result.filter((p) => typeof p.precio_compra === "number" && p.precio_compra >= priceMin)
  }
  if (typeof priceMax === "number") {
    result = result.filter((p) => typeof p.precio_compra === "number" && p.precio_compra <= priceMax)
  }

  // Stock range
  if (typeof stockMin === "number") {
    result = result.filter((p) => typeof p.cantidad_disponible === "number" && p.cantidad_disponible >= stockMin)
  }
  if (typeof stockMax === "number") {
    result = result.filter((p) => typeof p.cantidad_disponible === "number" && p.cantidad_disponible <= stockMax)
  }

  // Sorting
  if (sortBy) {
    const order = sortOrder === "asc" ? 1 : -1
    result.sort((a, b) => {
      const va = a[sortBy]
      const vb = b[sortBy]

      // handle undefined
      if (va === undefined && vb === undefined) return 0
      if (va === undefined) return 1 * order
      if (vb === undefined) return -1 * order

      // numeric compare
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * order

      // date compare (strings)
      if (sortBy === "created_at" || sortBy === "updated_at") {
        const da = new Date(va).getTime()
        const db = new Date(vb).getTime()
        return (da - db) * order
      }

      // fallback string compare
      return String(va).localeCompare(String(vb)) * order
    })
  }

  return result
}

export default filterProducts
