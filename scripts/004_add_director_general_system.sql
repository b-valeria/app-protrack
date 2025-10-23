-- Script para agregar el sistema de Director General
-- Este script crea las tablas necesarias para soportar múltiples roles y funcionalidades del Director General

-- 1. Crear tabla de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de sedes/almacenes
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  capacidad_maxima INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla de categorías ABC
CREATE TABLE IF NOT EXISTS abc_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('A', 'B', 'C', 'CUSTOM')),
  nombre TEXT, -- Para categorías personalizadas
  precio_minimo NUMERIC,
  precio_maximo NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de campos personalizados para formulario de productos
CREATE TABLE IF NOT EXISTS product_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  nombre_campo TEXT NOT NULL,
  tipo_campo TEXT NOT NULL CHECK (tipo_campo IN ('text', 'number', 'date', 'select', 'textarea')),
  opciones JSONB, -- Para campos tipo select
  requerido BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Actualizar tabla profiles para incluir más información
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salario_base NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permisos JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- 6. Actualizar tabla products para incluir categoría ABC y warehouse
ALTER TABLE products ADD COLUMN IF NOT EXISTS categoria_abc TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- 7. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON profiles(rol);
CREATE INDEX IF NOT EXISTS idx_warehouses_company_id ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_abc_categories_company_id ON abc_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria_abc ON products(categoria_abc);

-- 8. Habilitar RLS (Row Level Security) en las nuevas tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_form_fields ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para companies
CREATE POLICY "Los usuarios pueden ver su propia empresa"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Director General puede crear empresas"
  ON companies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

CREATE POLICY "Director General puede actualizar su empresa"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

-- 10. Políticas RLS para warehouses
CREATE POLICY "Los usuarios pueden ver las sedes de su empresa"
  ON warehouses FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Director General puede crear sedes"
  ON warehouses FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

CREATE POLICY "Director General puede actualizar sedes"
  ON warehouses FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

CREATE POLICY "Director General puede eliminar sedes"
  ON warehouses FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

-- 11. Políticas RLS para abc_categories
CREATE POLICY "Los usuarios pueden ver las categorías de su empresa"
  ON abc_categories FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Director General puede gestionar categorías"
  ON abc_categories FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

-- 12. Políticas RLS para product_form_fields
CREATE POLICY "Los usuarios pueden ver los campos de formulario de su empresa"
  ON product_form_fields FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Director General puede gestionar campos de formulario"
  ON product_form_fields FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

-- 13. Actualizar políticas de profiles para permitir que Director General gestione Administradores
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON profiles;

CREATE POLICY "Los usuarios pueden ver perfiles de su empresa"
  ON profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR id = auth.uid()
  );

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Director General puede crear Administradores"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

CREATE POLICY "Director General puede actualizar perfiles de su empresa"
  ON profiles FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
  );

CREATE POLICY "Director General puede eliminar Administradores"
  ON profiles FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND rol = 'Director General'
    )
    AND rol != 'Director General' -- No puede eliminar otros Directores
  );
