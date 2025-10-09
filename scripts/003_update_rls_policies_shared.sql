-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "products_select_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

DROP POLICY IF EXISTS "movimientos_select_own" ON public.movimientos;
DROP POLICY IF EXISTS "movimientos_insert_own" ON public.movimientos;

DROP POLICY IF EXISTS "traslados_select_own" ON public.traslados;
DROP POLICY IF EXISTS "traslados_insert_own" ON public.traslados;

-- Crear nuevas políticas compartidas para productos
CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_insert_all"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_all"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_delete_all"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- Crear nuevas políticas compartidas para movimientos
CREATE POLICY "movimientos_select_all"
  ON public.movimientos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "movimientos_insert_all"
  ON public.movimientos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Crear nuevas políticas compartidas para traslados
CREATE POLICY "traslados_select_all"
  ON public.traslados FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "traslados_insert_all"
  ON public.traslados FOR INSERT
  TO authenticated
  WITH CHECK (true);