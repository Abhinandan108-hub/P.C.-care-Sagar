-- ============================================================================
-- P.C. Care Sagar — Admin Modules schema (Categories, Brands, Website
-- Settings, Enquiries)
-- Run this once in Supabase Dashboard -> SQL Editor, AFTER products_schema.sql.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- CATEGORIES — extend the existing table with the fields the admin panel
-- needs (image, ordering, status, featured flag, slug, description).
-- ============================================================================
alter table public.categories
  add column if not exists image_url text,
  add column if not exists display_order integer not null default 0,
  add column if not exists status text not null default 'active',        -- active | inactive
  add column if not exists featured boolean not null default false,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill slugs for any existing rows that don't have one yet.
update public.categories
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
where slug is null or slug = '';

create unique index if not exists categories_slug_idx on public.categories (slug);
create index if not exists categories_display_order_idx on public.categories (display_order);
create index if not exists categories_status_idx on public.categories (status);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================================
-- BRANDS — extend the existing table with logo/image, category mapping,
-- description, status and featured flag.
-- ============================================================================
alter table public.brands
  add column if not exists logo_url text,
  add column if not exists image_url text,
  add column if not exists category_id uuid references public.categories (id) on delete set null,
  add column if not exists description text,
  add column if not exists status text not null default 'active',        -- active | inactive
  add column if not exists featured boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists brands_category_id_idx on public.brands (category_id);
create index if not exists brands_status_idx on public.brands (status);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ============================================================================
-- WEBSITE SETTINGS — single-row table holding every editable site setting.
-- ============================================================================
create table if not exists public.site_settings (
  id integer primary key default 1,

  company_name text not null default '',
  tagline text not null default '',
  logo_url text,
  favicon_url text,

  hero_banner_url text,
  hero_title text not null default '',
  hero_subtitle text not null default '',

  whatsapp_number text not null default '',
  phone_number text not null default '',
  email text not null default '',
  address text not null default '',
  google_map_link text not null default '',

  facebook_url text not null default '',
  instagram_url text not null default '',
  linkedin_url text not null default '',
  youtube_url text not null default '',

  business_hours text not null default '',
  footer_text text not null default '',
  copyright_text text not null default '',

  updated_at timestamptz not null default now(),

  constraint site_settings_single_row check (id = 1)
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- ============================================================================
-- ENQUIRIES — customer enquiries submitted from the public website.
-- ============================================================================
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,

  product_id uuid references public.products (id) on delete set null,
  product_name text,

  status text not null default 'new',    -- new | read

  created_at timestamptz not null default now()
);

create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.site_settings enable row level security;
alter table public.enquiries enable row level security;

-- Site settings: public can read (storefront needs it), only admins write.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Authenticated can manage site settings" on public.site_settings;
create policy "Authenticated can manage site settings"
  on public.site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Enquiries: anyone (including anonymous website visitors) can submit one,
-- but only authenticated admins can read / update / delete them.
drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries"
  on public.enquiries for insert
  with check (true);

drop policy if exists "Authenticated can read enquiries" on public.enquiries;
create policy "Authenticated can read enquiries"
  on public.enquiries for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated can update enquiries" on public.enquiries;
create policy "Authenticated can update enquiries"
  on public.enquiries for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete enquiries" on public.enquiries;
create policy "Authenticated can delete enquiries"
  on public.enquiries for delete
  using (auth.role() = 'authenticated');

-- ============================================================================
-- Storage — reuse the existing public "products" bucket for category/brand/
-- site images (folders: categories/, brands/, site/) so no extra bucket or
-- policy wiring is required. Policies from products_schema.sql already
-- allow authenticated read/write and public read on this bucket.
-- ============================================================================
