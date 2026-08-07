export type BrandStatus = "active" | "inactive";

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  image_url: string | null;
  category_id: string | null;
  category_name?: string | null;
  description: string | null;
  status: BrandStatus;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandFormValues {
  name: string;
  logo_url: string | null;
  image_url: string | null;
  category_id: string;
  description: string;
  status: BrandStatus;
  featured: boolean;
}

export const emptyBrandFormValues: BrandFormValues = {
  name: "",
  logo_url: null,
  image_url: null,
  category_id: "",
  description: "",
  status: "active",
  featured: false,
};

export function brandToFormValues(brand: Brand): BrandFormValues {
  return {
    name: brand.name,
    logo_url: brand.logo_url,
    image_url: brand.image_url,
    category_id: brand.category_id ?? "",
    description: brand.description ?? "",
    status: brand.status,
    featured: brand.featured,
  };
}

export interface BrandFilters {
  search: string;
  status: BrandStatus | "";
  categoryId: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_BRAND_FILTERS: BrandFilters = {
  search: "",
  status: "",
  categoryId: "",
  page: 1,
  pageSize: 12,
};
