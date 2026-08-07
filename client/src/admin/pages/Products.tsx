import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PackageSearch, PlusCircle } from "lucide-react";
import SearchBar from "../components/products/SearchBar";
import FilterBar from "../components/products/FilterBar";
import ProductTable from "../components/products/ProductTable";
import Pagination from "../components/products/Pagination";
import DeleteDialog from "../components/products/DeleteDialog";
import ProductDetailDrawer from "../components/products/ProductDetailDrawer";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { deleteProduct, getBrands, getCategories } from "../services/productService";
import { DEFAULT_FILTERS } from "../types/product";
import type { NamedOption, Product, ProductFilters } from "../types/product";

export default function Products() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [categories, setCategories] = useState<NamedOption[]>([]);
  const [brands, setBrands] = useState<NamedOption[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { products, totalCount, totalPages, loading, error, refetch } =
    useProducts(filters);

  useEffect(() => {
    getCategories().then(setCategories);
    getBrands().then(setBrands);
  }, []);

  function updateFilters(patch: Partial<ProductFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, search: prev.search }));
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct);
      toast.success("Product Deleted Successfully");
      setDeletingProduct(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasFilters =
    filters.search || filters.category || filters.brand || filters.featured !== null || filters.latest !== null;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Products</h1>
          <p>Manage your laptops, desktops, printers and accessories.</p>
        </div>
        <div className="admin-page-head__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ width: "auto" }}
            onClick={() => navigate("/admin/products/add")}
          >
            <PlusCircle size={16} />
            Add Product
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={filters.search}
          onChange={(search) => updateFilters({ search, page: 1 })}
        />
        <FilterBar
          filters={filters}
          categories={categories}
          brands={brands}
          onChange={updateFilters}
          onReset={resetFilters}
        />
      </div>

      <div className="admin-table-card">
        {loading ? (
          <LoadingSpinner label="Loading products…" />
        ) : error ? (
          <EmptyState
            icon={PackageSearch}
            title="Couldn't load products"
            description={error}
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={hasFilters ? "No products match your filters" : "No products yet"}
            description={
              hasFilters
                ? "Try adjusting or resetting your search and filters."
                : "Add your first product to get started."
            }
            action={
              !hasFilters ? (
                <button
                  className="admin-btn admin-btn--primary"
                  style={{ width: "auto", marginTop: 6 }}
                  onClick={() => navigate("/admin/products/add")}
                >
                  <PlusCircle size={16} />
                  Add Product
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ProductTable
              products={products}
              onView={setViewingProduct}
              onDelete={setDeletingProduct}
            />
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={filters.pageSize}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        )}
      </div>

      {viewingProduct && (
        <ProductDetailDrawer
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {deletingProduct && (
        <DeleteDialog
          product={deletingProduct}
          deleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </>
  );
}
