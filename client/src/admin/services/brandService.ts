import { adminClient } from "../lib/adminClient";
import type { Brand, BrandFilters, BrandFormValues } from "../types/brand";
import type { NamedOption } from "../types/product";

const TABLE = "brands";
const BUCKET = "products";

export interface GetBrandsResult {
  brands: Brand[];
  totalCount: number;
}

// Select with the related category name joined in, aliased for convenience.
const SELECT_WITH_CATEGORY = "*, category:categories(id, name)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    logo_url: row.logo_url,
    image_url: row.image_url,
    category_id: row.category_id,
    category_name: row.category?.name ?? null,
    description: row.description,
    status: row.status,
    featured: row.featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getBrands(filters: BrandFilters): Promise<GetBrandsResult> {
  let query = adminClient.from(TABLE).select(SELECT_WITH_CATEGORY, { count: "exact" });

  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/,/g, " ");
    query = query.ilike("name", `%${term}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  query = query.order("name", { ascending: true });

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    brands: (data ?? []).map(normalize),
    totalCount: count ?? 0,
  };
}

export async function getAllBrands(): Promise<NamedOption[]> {
  const { data, error } = await adminClient.from(TABLE).select("id, name").order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as NamedOption[];
}

export async function getBrandById(id: string): Promise<Brand> {
  const { data, error } = await adminClient.from(TABLE).select(SELECT_WITH_CATEGORY).eq("id", id).single();
  if (error) throw error;
  return normalize(data);
}

function toDbPayload(values: BrandFormValues) {
  return {
    name: values.name.trim(),
    logo_url: values.logo_url,
    image_url: values.image_url,
    category_id: values.category_id || null,
    description: values.description.trim() || null,
    status: values.status,
    featured: values.featured,
  };
}

export async function createBrand(values: BrandFormValues): Promise<Brand> {
  const payload = toDbPayload(values);
  const { data, error } = await adminClient
    .from(TABLE)
    .insert(payload)
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return normalize(data);
}

export async function updateBrand(id: string, values: BrandFormValues): Promise<Brand> {
  const payload = toDbPayload(values);
  const { data, error } = await adminClient
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return normalize(data);
}

function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function deleteBrand(brand: Brand): Promise<void> {
  const { error } = await adminClient.from(TABLE).delete().eq("id", brand.id);
  if (error) throw error;

  const images = [brand.logo_url, brand.image_url].filter((u): u is string => Boolean(u));
  const paths = images.map(pathFromPublicUrl).filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    const { error: storageError } = await adminClient.storage.from(BUCKET).remove(paths);
    if (storageError) {
      // eslint-disable-next-line no-console
      console.warn("Brand images could not be removed from storage:", storageError.message);
    }
  }
}
