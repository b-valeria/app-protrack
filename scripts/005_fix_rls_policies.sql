-- Script de corrección final basado en el esquema real de la base de datos
-- Este script es seguro de ejecutar múltiples veces

-- PASO 1: Agregar columnas faltantes
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS director_id uuid REFERENCES auth.users(id);

-- PASO 2: Eliminar TODAS las políticas existentes (sin errores si no existen)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Director General puede crear Administradores" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles de su empresa" ON public.profiles;

DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "Director General puede crear empresas" ON public.companies;
DROP POLICY IF EXISTS "Director General puede ver su empresa" ON public.companies;
DROP POLICY IF EXISTS "Director General puede actualizar su empresa" ON public.companies;

DROP POLICY IF EXISTS "warehouses_select_company" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert_company" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update_company" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete_company" ON public.warehouses;

DROP POLICY IF EXISTS "abc_categories_select_company" ON public.abc_categories;
DROP POLICY IF EXISTS "abc_categories_insert_company" ON public.abc_categories;
DROP POLICY IF EXISTS "abc_categories_update_company" ON public.abc_categories;
DROP POLICY IF EXISTS "abc_categories_delete_company" ON public.abc_categories;

DROP POLICY IF EXISTS "product_form_fields_select_company" ON public.product_form_fields;
DROP POLICY IF EXISTS "product_form_fields_insert_company" ON public.product_form_fields;
DROP POLICY IF EXISTS "product_form_fields_update_company" ON public.product_form_fields;
DROP POLICY IF EXISTS "product_form_fields_delete_company" ON public.product_form_fields;

DROP POLICY IF EXISTS "products_select_company" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

DROP POLICY IF EXISTS "movements_select_own" ON public.movements;
DROP POLICY IF EXISTS "movements_insert_own" ON public.movements;
DROP POLICY IF EXISTS "movements_update_own" ON public.movements;
DROP POLICY IF EXISTS "movements_delete_own" ON public.movements;

DROP POLICY IF EXISTS "transfers_select_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_insert_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_update_own" ON public.transfers;
DROP POLICY IF EXISTS "transfers_delete_own" ON public.transfers;

-- PASO 3: Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas simples para PROFILES (sin recursión)
-- Estas políticas solo usan auth.uid() directamente, sin consultar profiles

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- PASO 5: Crear políticas para COMPANIES
-- Los usuarios pueden ver/actualizar la empresa de su perfil

CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT
  WITH CHECK (true); -- Permitir crear empresas durante el registro

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- PASO 6: Crear políticas para WAREHOUSES
-- Los usuarios pueden ver/gestionar las sedes de su empresa

CREATE POLICY "warehouses_select_company" ON public.warehouses
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "warehouses_insert_company" ON public.warehouses
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "warehouses_update_company" ON public.warehouses
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "warehouses_delete_company" ON public.warehouses
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- PASO 7: Crear políticas para ABC_CATEGORIES

CREATE POLICY "abc_categories_select_company" ON public.abc_categories
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "abc_categories_insert_company" ON public.abc_categories
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "abc_categories_update_company" ON public.abc_categories
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "abc_categories_delete_company" ON public.abc_categories
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- PASO 8: Crear políticas para PRODUCT_FORM_FIELDS

CREATE POLICY "product_form_fields_select_company" ON public.product_form_fields
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_form_fields_insert_company" ON public.product_form_fields
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_form_fields_update_company" ON public.product_form_fields
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_form_fields_delete_company" ON public.product_form_fields
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- PASO 9: Crear políticas para PRODUCTS

CREATE POLICY "products_select_own" ON public.products
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE
  USING (user_id = auth.uid());

-- PASO 10: Crear políticas para MOVEMENTS

CREATE POLICY "movements_select_own" ON public.movements
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "movements_insert_own" ON public.movements
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "movements_update_own" ON public.movements
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "movements_delete_own" ON public.movements
  FOR DELETE
  USING (user_id = auth.uid());

-- PASO 11: Crear políticas para TRANSFERS

CREATE POLICY "transfers_select_own" ON public.transfers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transfers_insert_own" ON public.transfers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transfers_update_own" ON public.transfers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transfers_delete_own" ON public.transfers
  FOR DELETE
  USING (user_id = auth.uid());
