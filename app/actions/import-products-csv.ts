"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "")
    .trim()
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") {
    return null
  }

  const formats = [
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
  ]

  for (const format of formats) {
    const match = dateStr.trim().match(format)
    if (match) {
      let year: number, month: number, day: number

      if (match[1].length === 4) {
        // YYYY-MM-DD format
        year = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        day = Number.parseInt(match[3])
      } else {
        // DD/MM/YYYY format
        day = Number.parseInt(match[1])
        month = Number.parseInt(match[2])
        year = Number.parseInt(match[3])
      }

      // Validate the date by creating a Date object and checking if it matches
      const date = new Date(year, month - 1, day)

      // Check if the date is valid and matches the input values
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        const yearStr = year.toString()
        const monthStr = month.toString().padStart(2, "0")
        const dayStr = day.toString().padStart(2, "0")
        return `${yearStr}-${monthStr}-${dayStr}`
      } else {
        console.error("[v0] Invalid date detected:", dateStr)
        return null
      }
    }
  }

  // Try parsing as a standard date string
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]
    }
  } catch (e) {
    console.error("[v0] Error parsing date:", dateStr, e)
  }

  return null
}

export async function importProductsFromCSV(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const companyId = formData.get("companyId") as string
    const userId = formData.get("userId") as string

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    console.log("[v0] Starting CSV import for company:", companyId)

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return { success: false, error: "El archivo CSV está vacío o no tiene datos" }
    }

    const rawHeaders = lines[0].split(",").map((h) => h.trim())
    const normalizedHeaders = rawHeaders.map(normalizeColumnName)
    console.log("[v0] Raw CSV Headers:", rawHeaders)
    console.log("[v0] Normalized Headers:", normalizedHeaders)

    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const normalizedName = normalizeColumnName(name)
        const index = normalizedHeaders.findIndex(
          (h) => h === normalizedName || h.includes(normalizedName) || normalizedName.includes(h),
        )
        if (index !== -1) return index
      }
      return -1
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const idIdx = getColumnIndex(["id", "codigo", "sku", "codigo_producto"])
    const productIds = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      if (values.length > 0 && values[0] && idIdx !== -1) {
        productIds.push(values[idIdx])
      }
    }

    const { data: existingProducts } = await supabaseAdmin.from("products").select("id").in("id", productIds)

    const existingIds = new Set(existingProducts?.map((p) => p.id) || [])

    const products = []
    const errors = []
    const duplicates = []
    const warnings = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim())

        if (values.length === 0 || !values[0]) {
          continue
        }

        const nombreIdx = getColumnIndex(["nombre", "name", "producto", "descripcion"])
        const ubicacionIdx = getColumnIndex(["ubicacion", "location", "almacen", "bodega"])
        const lotesIdx = getColumnIndex(["numero_lotes", "lotes", "numero lotes", "num_lotes", "cantidad_lotes"])
        const tamanoLoteIdx = getColumnIndex(["tamano_lote", "tamaño_lote", "tamano lote", "tamaño lote", "size_lote"])
        const unidadesIdx = getColumnIndex(["unidades", "units", "unidad"])
        const cantidadIdx = getColumnIndex([
          "cantidad_disponible",
          "cantidad",
          "stock",
          "disponible",
          "cantidad disponible",
        ])
        const fechaExpIdx = getColumnIndex(["fecha_expiracion", "expiracion", "fecha exp", "fecha_exp", "vencimiento"])
        const proveedoresIdx = getColumnIndex(["proveedores", "proveedor", "supplier", "vendedor"])
        const umbralMinIdx = getColumnIndex(["umbral_minimo", "minimo", "min", "umbral minimo", "stock_minimo"])
        const umbralMaxIdx = getColumnIndex(["umbral_maximo", "maximo", "max", "umbral maximo", "stock_maximo"])
        const entradaIdx = getColumnIndex(["entrada", "entry", "ingreso"])
        const precioIdx = getColumnIndex(["precio_compra", "precio", "price", "precio compra", "costo"])
        const totalIdx = getColumnIndex(["total_compra", "total", "total compra", "monto_total"])
        const imagenIdx = getColumnIndex(["imagen_url", "imagen", "image", "foto", "url_imagen"])
        const categoriaIdx = getColumnIndex(["categoria_abc", "categoria", "category", "tipo"])

        const productId = idIdx !== -1 ? values[idIdx] : `PROD-${Date.now()}-${i}`

        if (existingIds.has(productId)) {
          duplicates.push(`Fila ${i + 1}: El ID "${productId}" ya existe en la base de datos`)
          continue
        }

        const fechaExpiracion = fechaExpIdx !== -1 ? parseDate(values[fechaExpIdx]) : null
        if (fechaExpIdx !== -1 && values[fechaExpIdx] && !fechaExpiracion) {
          warnings.push(`Fila ${i + 1}: Fecha inválida "${values[fechaExpIdx]}" - se omitirá la fecha`)
        }

        const defaultExpirationDate = new Date()
        defaultExpirationDate.setFullYear(defaultExpirationDate.getFullYear() + 1)
        const defaultDateStr = defaultExpirationDate.toISOString().split("T")[0]

        const product: any = {
          id: productId,
          nombre: nombreIdx !== -1 ? values[nombreIdx] : `Producto ${i}`,
          ubicacion: ubicacionIdx !== -1 ? values[ubicacionIdx] : "",
          numero_lotes: lotesIdx !== -1 ? Number.parseInt(values[lotesIdx]) || 0 : 0,
          tamano_lote: tamanoLoteIdx !== -1 ? Number.parseInt(values[tamanoLoteIdx]) || 0 : 0,
          unidades: unidadesIdx !== -1 ? Number.parseInt(values[unidadesIdx]) || 0 : 0,
          cantidad_disponible: cantidadIdx !== -1 ? Number.parseInt(values[cantidadIdx]) || 0 : 0,
          fecha_expiracion: fechaExpiracion || defaultDateStr, // Use default date instead of null
          proveedores: proveedoresIdx !== -1 ? values[proveedoresIdx] : "",
          umbral_minimo: umbralMinIdx !== -1 ? Number.parseInt(values[umbralMinIdx]) || 0 : 0,
          umbral_maximo: umbralMaxIdx !== -1 ? Number.parseInt(values[umbralMaxIdx]) || 0 : 0,
          entrada: entradaIdx !== -1 ? values[entradaIdx] : "",
          precio_compra: precioIdx !== -1 ? Number.parseFloat(values[precioIdx]) || 0 : 0,
          total_compra: totalIdx !== -1 ? Number.parseFloat(values[totalIdx]) || 0 : 0,
          imagen_url: imagenIdx !== -1 && values[imagenIdx] ? values[imagenIdx] : null,
          user_id: userId || null,
          categoria_abc: categoriaIdx !== -1 && values[categoriaIdx] ? values[categoriaIdx] : null,
          warehouse_id: null,
        }

        products.push(product)
      } catch (error) {
        console.error(`[v0] Error processing row ${i + 1}:`, error)
        errors.push(`Fila ${i + 1}: Error al procesar`)
      }
    }

    console.log("[v0] Parsed products:", products.length)
    console.log("[v0] Duplicates found:", duplicates.length)
    console.log("[v0] Warnings:", warnings.length)

    if (products.length === 0 && duplicates.length === 0) {
      return { success: false, error: "No se pudieron procesar productos del CSV" }
    }

    if (products.length > 0) {
      const { data, error } = await supabaseAdmin.from("products").insert(products)

      if (error) {
        console.error("[v0] Error inserting products:", error)
        return { success: false, error: `Error al insertar productos: ${error.message}` }
      }
    }

    console.log("[v0] Successfully imported products:", products.length)

    const resultMessage = []
    if (products.length > 0) {
      resultMessage.push(`${products.length} productos importados exitosamente`)
    }
    if (duplicates.length > 0) {
      resultMessage.push(`${duplicates.length} productos omitidos por ID duplicado`)
    }
    if (warnings.length > 0) {
      resultMessage.push(`${warnings.length} advertencias de fechas inválidas`)
    }

    return {
      success: true,
      data: {
        imported: products.length,
        duplicates: duplicates,
        warnings: warnings.length > 0 ? warnings : null,
        errors: errors.length > 0 ? errors : null,
        message: resultMessage.join(". "),
      },
    }
  } catch (error: any) {
    console.error("[v0] Error importing CSV:", error)
    return { success: false, error: error.message || "Error al importar CSV" }
  }
}
