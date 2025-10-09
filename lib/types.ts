export interface Product {
  id: string
  nombre: string
  imagen_url?: string | null
  cantidad_disponible?: number
  ubicacion?: string
  codigo_barras?: string | null
  updated_at?: string | null
  // include other optional fields that may exist in DB
  [key: string]: any
}

export default Product
