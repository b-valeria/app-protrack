-- Script para resetear y crear todas las tablas desde cero
-- Ejecuta este script si ya intentaste ejecutar el anterior

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "products_select_own" ON public.products;
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

-- Eliminar trigger y función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Eliminar tablas existentes (en orden correcto por dependencias)
DROP TABLE IF EXISTS public.transfers CASCADE;
DROP TABLE IF EXISTS public.movements CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'Administradora',
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crear tabla de productos
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  numero_lotes INTEGER NOT NULL,
  tamano_lote INTEGER NOT NULL,
  unidades INTEGER NOT NULL,
  cantidad_disponible INTEGER NOT NULL,
  fecha_expiracion DATE NOT NULL,
  proveedores TEXT NOT NULL,
  umbral_minimo INTEGER NOT NULL,
  umbral_maximo INTEGER NOT NULL,
  entrada TEXT NOT NULL,
  precio_compra DECIMAL(10, 2) NOT NULL,
  total_compra DECIMAL(10, 2) NOT NULL,
  imagen_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas para products
CREATE POLICY "products_select_own"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "products_delete_own"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- Crear tabla de movimientos (ventas)
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL,
  unidades INTEGER NOT NULL,
  fecha_movimiento DATE NOT NULL,
  precio_venta DECIMAL(10, 2) NOT NULL,
  ganancia DECIMAL(10, 2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Políticas para movements
CREATE POLICY "movements_select_own"
  ON public.movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "movements_insert_own"
  ON public.movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movements_update_own"
  ON public.movements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "movements_delete_own"
  ON public.movements FOR DELETE
  USING (auth.uid() = user_id);

-- Crear tabla de traslados
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  sede_origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  fecha DATE NOT NULL,
  motivo TEXT NOT NULL,
  encargado TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Políticas para transfers
CREATE POLICY "transfers_select_own"
  ON public.transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transfers_insert_own"
  ON public.transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transfers_update_own"
  ON public.transfers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "transfers_delete_own"
  ON public.transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, rol)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'nombre', 'Usuario'),
    'Administradora'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
