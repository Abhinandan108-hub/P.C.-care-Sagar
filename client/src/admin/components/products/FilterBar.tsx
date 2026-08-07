import { RotateCcw } from "lucide-react";
import type { NamedOption, ProductFilters, SortOption } from "../../types/product";

interface FilterBarProps {
  filters: ProductFilters;
  categories: NamedOption[];
  brands: NamedOption[];
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
}

const featuredOptions = [
  { label: "All Products", value: "" },
  { label: "Featured Only", value: "true" },
  { label: "Not Featured", value: "false" },
];

const latestOptions = [
  { label: "All", value: "" },
  { label: "Latest Only", value: "true" },
  { label: "Not Latest", value: "false" },
];

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price: Low to High", value: "price_low_high" },
  { label: "Price: High to Low", value: "price_high_low" },
];

function toTriState(v: string): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function fromTriState(v: boolean | null): string {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

export default function FilterBar({
  filters,
  categories,
  brands,
  onChange,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.category ||
    filters.brand ||
    filters.featured !== null ||
    filters.latest !== null ||
    filters.sort !== "newest";

  return (
    <div className="admin-filter-bar">
      <select
        className="admin-select"
        value={filters.category}
        onChange={(e) => onChange({ category: e.target.value, page: 1 })}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="admin-select"
        value={filters.brand}
        onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
        aria-label="Filter by brand"
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.name}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        className="admin-select"
        value={fromTriState(filters.featured)}
        onChange={(e) =>
          onChange({ featured: toTriState(e.target.value), page: 1 })
        }
        aria-label="Filter by featured"
      >
        {featuredOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="admin-select"
        value={fromTriState(filters.latest)}
        onChange={(e) =>
          onChange({ latest: toTriState(e.target.value), page: 1 })
        }
        aria-label="Filter by latest"
      >
        {latestOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        className="admin-select"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as SortOption, page: 1 })}
        aria-label="Sort products"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {hasActiveFilters ? (
        <button type="button" className="admin-filter-chip" onClick={onReset}>
          <RotateCcw size={13} />
          Reset
        </button>
      ) : null}
    </div>
  );
}
