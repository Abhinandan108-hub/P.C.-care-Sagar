import { supabase } from "../lib/supabaseClient";
import { slugify } from "../utils/slugify";
import type {
  Category,
  CategoryFilters,
  CategoryFormValues,
} from "../types/category";
import type { NamedOption } from "../types/product";

const TABLE = "categories";
const BUCKET = "products";

export interface GetCategoriesResult {
  categories: Category[];
  totalCount: number;
}

async function withProductCounts(
  rows: Omit<Category, "product_count">[]
): Promise<Category[]> {
  const counts = await Promise.all(
    rows.map((row) =>
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category", row.name)
    )
  );

  return rows.map((row, idx) => ({
    ...row,
    product_count: counts[idx].count ?? 0,
  }));
}

/** Fetch a paginated, searchable list of categories, ordered by display order. */
export async function getCategories(
  filters: CategoryFilters
): Promise<GetCategoriesResult> {
  let query = supabase.from(TABLE).select("*", { count: "exact" });

  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/,/g, " ");
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  query = query.order("display_order", { ascending: true }).order("name", { ascending: true });

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const categories = await withProductCounts((data ?? []) as Omit<Category, "product_count">[]);

  return { categories, totalCount: count ?? 0 };
}

/** Simple id/name list for dropdowns (e.g. brand category mapping). */
export async function getAllCategories(): Promise<NamedOption[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as NamedOption[];
}

export async function getCategoryById(id: string): Promise<Category> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error) throw error;
  const [withCount] = await withProductCounts([data as Omit<Category, "product_count">]);
  return withCount;
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "category";
  let candidate = root;
  let suffix = 2;

  // Keep trying until we find a slug that isn't already taken by another row.
  // Loop is bounded by the number of existing conflicting rows, never infinite.
  for (;;) {
    let query = supabase.from(TABLE).select("id").eq("slug", candidate).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${suffix++}`;
  }
}

function toDbPayload(values: CategoryFormValues) {
  return {
    name: values.name.trim(),
    slug: slugify(values.slug || values.name),
    image_url: values.image_url,
    display_order: Number(values.display_order) || 0,
    status: values.status,
    featured: values.featured,
    description: values.description.trim() || null,
  };
}

export async function createCategory(values: CategoryFormValues): Promise<Category> {
  const payload = toDbPayload(values);
  const slug = await uniqueSlug(payload.slug || payload.name);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, slug })
    .select("*")
    .single();

  if (error) throw error;
  const [withCount] = await withProductCounts([data as Omit<Category, "product_count">]);
  return withCount;
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues
): Promise<Category> {
  const payload = toDbPayload(values);
  const slug = await uniqueSlug(payload.slug || payload.name, id);

  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...payload, slug })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const [withCount] = await withProductCounts([data as Omit<Category, "product_count">]);
  return withCount;
}

function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function deleteCategory(category: Category): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", category.id);
  if (error) throw error;

  if (category.image_url) {
    const path = pathFromPublicUrl(category.image_url);
    if (path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
      if (storageError) {
        // eslint-disable-next-line no-console
        console.warn("Category image could not be removed from storage:", storageError.message);
      }
    }
  }
}
