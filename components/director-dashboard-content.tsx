"use client"
import DirectorCatalog from "@/components/director-catalog"
import DirectorStaff from "@/components/director-staff"
import DirectorMovements from "@/components/director-movements"

interface Product {
  id: string
  nombre: string
  imagen_url: string | null
  cantidad_disponible: number
  ubicacion: string
  umbral_minimo: number
  umbral_maximo: number
}

interface StaffMember {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: string
  posicion: string | null
  foto_url: string | null
  salario_base: number | null
  permisos: any // Added permisos field to match DirectorStaff interface
}

interface Warehouse {
  id: string
  nombre: string
  capacidad_maxima: number
}

interface DirectorDashboardContentProps {
  products: Product[]
  staff: StaffMember[]
  warehouses: Warehouse[]
  companyId: string
}

export default function DirectorDashboardContent({
  products,
  staff,
  warehouses,
  companyId,
}: DirectorDashboardContentProps) {
  // const [activeTab, setActiveTab] = useState("catalog")

  return (
    <div className="space-y-8">
      <DirectorCatalog products={products} companyId={companyId} warehouses={warehouses} />
      <DirectorStaff staff={staff} companyId={companyId} />
      <DirectorMovements companyId={companyId} warehouses={warehouses} />
    </div>
  )
}
