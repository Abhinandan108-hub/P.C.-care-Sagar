export type ProductAvailability = "in_stock" | "out_of_stock" | "coming_soon";
export type ProductStatus = "active" | "inactive";

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;

  price: number;
  mrp: number;
  offer_percentage: number;

  processor: string | null;
  ram: string | null;
  storage: string | null;
  graphics: string | null;
  display_size: string | null;
  operating_system: string | null;
  warranty: string | null;

  description: string | null;

  specifications: ProductSpecification[];
  highlights: string[];

  image_url: string | null;
  gallery_images: string[];

  featured: boolean;
  latest: boolean;
  availability: ProductAvailability;
  status: ProductStatus;

  created_at: string;
  updated_at: string;
}

/** Shape produced by the Add/Edit product form. */
export interface ProductFormValues {
  name: string;
  category: string;
  brand: string;

  price: number | string;
  mrp: number | string;
  offer_percentage: number | string;

  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  display_size: string;
  operating_system: string;
  warranty: string;

  description: string;

  specifications: ProductSpecification[];
  highlights: { value: string }[];

  featured: boolean;
  latest: boolean;
  availability: ProductAvailability;
  status: ProductStatus;

  image_url: string | null;
  gallery_images: string[];
}

export interface NamedOption {
  id: string;
  name: string;
}

export type SortOption =
  | "newest"
  | "oldest"
  | "price_low_high"
  | "price_high_low";

export interface ProductFilters {
  search: string;
  category: string;
  brand: string;
  featured: boolean | null;
  latest: boolean | null;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  category: "",
  brand: "",
  featured: null,
  latest: null,
  sort: "newest",
  page: 1,
  pageSize: 20,
};
