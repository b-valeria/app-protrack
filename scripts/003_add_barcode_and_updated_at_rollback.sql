-- Rollback for 003_add_barcode_and_updated_at.sql
-- WARNING: This will remove columns and trigger; make sure you have a backup before running.

BEGIN;

-- Remove index if exists
DROP INDEX IF EXISTS idx_products_codigo_barras;

-- Drop trigger and function
DROP TRIGGER IF EXISTS set_updated_at_trigger ON public.products;
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop columns (this will delete data in these columns)
ALTER TABLE public.products DROP COLUMN IF EXISTS codigo_barras;
ALTER TABLE public.products DROP COLUMN IF EXISTS updated_at;

COMMIT;
