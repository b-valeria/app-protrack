create extension if not exists "pgcrypto";

create table if not exists restock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now()
);

create or replace function request_restock_and_update(
  p_product_id uuid,
  p_qty integer,
  p_requested_by uuid
) returns table (product_id uuid, cantidad_disponible integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock integer;
  max_stock integer;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select cantidad_disponible, umbral_maximo
    into current_stock, max_stock
    from products
   where id = p_product_id
   for update;

  if not found then
    raise exception 'Product % not found', p_product_id;
  end if;

  insert into restock_requests (product_id, quantity, requested_by)
  values (p_product_id, p_qty, p_requested_by);

  update products
     set cantidad_disponible = least(coalesce(max_stock, current_stock + p_qty), current_stock + p_qty)
   where id = p_product_id
   returning id, cantidad_disponible into product_id, cantidad_disponible;

  return next;
end;
$$;