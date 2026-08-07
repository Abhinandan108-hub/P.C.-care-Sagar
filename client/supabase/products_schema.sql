-- ============================================================================
-- P.C. Care Sagar — Product Management System schema
-- Run this once in Supabase Dashboard -> SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- brands ----------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  category text not null,
  brand text not null,

  price numeric(12, 2) not null default 0,
  mrp numeric(12, 2) not null default 0,
  offer_percentage numeric(5, 2) not null default 0,

  processor text,
  ram text,
  storage text,
  graphics text,
  display_size text,
  operating_system text,
  warranty text,

  description text,

  specifications jsonb not null default '[]'::jsonb, -- [{ "key": "Weight", "value": "1.4 kg" }]
  highlights jsonb not null default '[]'::jsonb,      -- ["Backlit keyboard", "Fingerprint reader"]

  image_url text,                                     -- primary image (public URL)
  gallery_images jsonb not null default '[]'::jsonb,  -- ["url1", "url2", ...]

  featured boolean not null default false,
  latest boolean not null default false,
  availability text not null default 'in_stock',      -- in_stock | out_of_stock | coming_soon
  status text not null default 'active',              -- active | inactive

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- keep updated_at fresh on every update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- Public (anon) visitors can only READ products for the storefront.
-- Only authenticated admin users can insert/update/delete.
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  using (true);

drop policy if exists "Authenticated can manage products" on public.products;
create policy "Authenticated can manage products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select
  using (true);

drop policy if exists "Authenticated can manage categories" on public.categories;
create policy "Authenticated can manage categories"
  on public.categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Public can read brands" on public.brands;
create policy "Public can read brands"
  on public.brands for select
  using (true);

drop policy if exists "Authenticated can manage brands" on public.brands;
create policy "Authenticated can manage brands"
  on public.brands for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================================
-- Storage bucket for product images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'products');

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Authenticated can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can update product images" on storage.objects;
create policy "Authenticated can update product images"
  on storage.objects for update
  using (bucket_id = 'products' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Authenticated can delete product images"
  on storage.objects for delete
  using (bucket_id = 'products' and auth.role() = 'authenticated');

-- ============================================================================
-- Optional: a few starter categories/brands so the Add Product dropdowns
-- aren't empty on first run. Safe to edit/delete anytime.
-- ============================================================================
insert into public.categories (name) values
  ('Laptops'), ('Desktops'), ('Printers'), ('Networking'), ('Accessories'), ('Monitors')
on conflict (name) do nothing;

insert into public.brands (name) values
  ('HP'), ('Dell'), ('Lenovo'), ('Asus'), ('Acer'), ('Apple'), ('Canon'), ('Epson')
on conflict (name) do nothing;
