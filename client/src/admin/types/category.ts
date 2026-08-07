export type CategoryStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  display_order: number;
  status: CategoryStatus;
  featured: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** Not a DB column — computed at query time from the products table. */
  product_count: number;
}

export interface CategoryFormValues {
  name: string;
  slug: string;
  image_url: string | null;
  display_order: number | string;
  status: CategoryStatus;
  featured: boolean;
  description: string;
}

export const emptyCategoryFormValues: CategoryFormValues = {
  name: "",
  slug: "",
  image_url: null,
  display_order: 0,
  status: "active",
  featured: false,
  description: "",
};

export function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    image_url: category.image_url,
    display_order: category.display_order,
    status: category.status,
    featured: category.featured,
    description: category.description ?? "",
  };
}

export interface CategoryFilters {
  search: string;
  status: CategoryStatus | "";
  page: number;
  pageSize: number;
}

export const DEFAULT_CATEGORY_FILTERS: CategoryFilters = {
  search: "",
  status: "",
  page: 1,
  pageSize: 12,
};
