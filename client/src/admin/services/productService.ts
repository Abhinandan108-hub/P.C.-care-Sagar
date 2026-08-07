import { supabase } from "../lib/supabaseClient";
import type {
  NamedOption,
  Product,
  ProductFilters,
  ProductFormValues,
} from "../types/product";

const TABLE = "products";
const BUCKET = "products";

export interface GetProductsResult {
  products: Product[];
  totalCount: number;
}

/** Fetch a paginated, filtered, sorted list of products. */
export async function getProducts(
  filters: ProductFilters
): Promise<GetProductsResult> {
  let query = supabase.from(TABLE).select("*", { count: "exact" });

  if (filters.search.trim()) {
    // Supabase's .or() filter uses commas as separators, so strip them from
    // the raw search term to avoid breaking the query syntax.
    const term = filters.search.trim().replace(/,/g, " ");
    query = query.or(
      `name.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`
    );
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.brand) {
    query = query.eq("brand", filters.brand);
  }

  if (filters.featured !== null) {
    query = query.eq("featured", filters.featured);
  }

  if (filters.latest !== null) {
    query = query.eq("latest", filters.latest);
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_low_high":
      query = query.order("price", { ascending: true });
      break;
    case "price_high_low":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: (data ?? []) as Product[],
    totalCount: count ?? 0,
  };
}

export async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Product;
}

function toDbPayload(values: ProductFormValues) {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    brand: values.brand.trim(),
    price: Number(values.price) || 0,
    mrp: Number(values.mrp) || 0,
    offer_percentage: Number(values.offer_percentage) || 0,
    processor: values.processor.trim() || null,
    ram: values.ram.trim() || null,
    storage: values.storage.trim() || null,
    graphics: values.graphics.trim() || null,
    display_size: values.display_size.trim() || null,
    operating_system: values.operating_system.trim() || null,
    warranty: values.warranty.trim() || null,
    description: values.description.trim() || null,
    specifications: values.specifications.filter(
      (s) => s.key.trim() && s.value.trim()
    ),
    highlights: values.highlights
      .map((h) => h.value.trim())
      .filter((v) => v.length > 0),
    featured: values.featured,
    latest: values.latest,
    availability: values.availability,
    status: values.status,
    image_url: values.image_url,
    gallery_images: values.gallery_images,
  };
}

export async function createProduct(values: ProductFormValues): Promise<Product> {
  const payload = toDbPayload(values);
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<Product> {
  const payload = toDbPayload(values);
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Product;
}

/** Extract the storage object path from a Supabase public URL. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteImagesFromStorage(urls: string[]) {
  const paths = urls
    .map(pathFromPublicUrl)
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  // Don't fail the whole delete flow if a storage object was already gone.
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("Some product images could not be removed from storage:", error.message);
  }
}

export async function deleteProduct(product: Product): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", product.id);
  if (error) throw error;

  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.gallery_images ?? []),
  ];
  await deleteImagesFromStorage(allImages);
}

export async function getCategories(): Promise<NamedOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as NamedOption[];
}

export async function getBrands(): Promise<NamedOption[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as NamedOption[];
}
