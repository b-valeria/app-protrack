BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS codigo_barras TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger sólo si no existe (evita DROP)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_trigger' AND tgrelid = 'public.products'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_trigger
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_products_codigo_barras ON public.products (codigo_barras);

COMMIT;