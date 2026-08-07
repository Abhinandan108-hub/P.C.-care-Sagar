import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Tag } from "lucide-react";
import SearchBar from "../components/common/SearchBar";
import Pagination from "../components/common/Pagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ViewToggle from "../components/common/ViewToggle";
import type { ViewMode } from "../components/common/ViewToggle";
import BrandTable from "../components/brands/BrandTable";
import BrandCard from "../components/brands/BrandCard";
import BrandFormModal from "../components/brands/BrandFormModal";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useBrands } from "../hooks/useBrands";
import { createBrand, deleteBrand, updateBrand } from "../services/brandService";
import { getAllCategories } from "../services/categoryService";
import { brandToFormValues, DEFAULT_BRAND_FILTERS, emptyBrandFormValues } from "../types/brand";
import type { Brand, BrandFilters, BrandFormValues } from "../types/brand";
import type { NamedOption } from "../types/product";

export default function Brands() {
  const [filters, setFilters] = useState<BrandFilters>(DEFAULT_BRAND_FILTERS);
  const [view, setView] = useState<ViewMode>("cards");
  const [categories, setCategories] = useState<NamedOption[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { brands, totalCount, totalPages, loading, error, refetch } = useBrands(filters);

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  function updateFilters(patch: Partial<BrandFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function openAdd() {
    setEditingBrand(null);
    setModalMode("add");
  }

  function openEdit(brand: Brand) {
    setEditingBrand(brand);
    setModalMode("edit");
  }

  function closeModal() {
    if (submitting) return;
    setModalMode(null);
    setEditingBrand(null);
  }

  async function handleSubmit(values: BrandFormValues) {
    setSubmitting(true);
    try {
      if (modalMode === "edit" && editingBrand) {
        await updateBrand(editingBrand.id, values);
        toast.success("Brand Updated Successfully");
      } else {
        await createBrand(values);
        toast.success("Brand Added Successfully");
      }
      setModalMode(null);
      setEditingBrand(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBrand) return;
    setDeleting(true);
    try {
      await deleteBrand(deletingBrand);
      toast.success("Brand Deleted Successfully");
      setDeletingBrand(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(filters.search || filters.status || filters.categoryId);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Brands</h1>
          <p>Manage the brands you carry — HP, Dell, Lenovo, Apple, ASUS and more.</p>
        </div>
        <div className="admin-page-head__actions">
          <button className="admin-btn admin-btn--primary" style={{ width: "auto" }} onClick={openAdd}>
            <PlusCircle size={16} />
            Add Brand
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={filters.search}
          onChange={(search) => updateFilters({ search, page: 1 })}
          placeholder="Search by brand name…"
          ariaLabel="Search brands"
        />
        <div className="admin-filter-bar">
          <select
            className="admin-select"
            value={filters.categoryId}
            onChange={(e) => updateFilters({ categoryId: e.target.value, page: 1 })}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value as BrandFilters["status"], page: 1 })}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {loading ? (
        <div className="admin-table-card">
          <LoadingSpinner label="Loading brands…" />
        </div>
      ) : error ? (
        <div className="admin-table-card">
          <EmptyState icon={Tag} title="Couldn't load brands" description={error} />
        </div>
      ) : brands.length === 0 ? (
        <div className="admin-table-card">
          <EmptyState
            icon={Tag}
            title={hasFilters ? "No brands match your filters" : "No brands yet"}
            description={
              hasFilters ? "Try adjusting or resetting your search and filters." : "Add your first brand to get started."
            }
            action={
              !hasFilters ? (
                <button className="admin-btn admin-btn--primary" style={{ width: "auto", marginTop: 6 }} onClick={openAdd}>
                  <PlusCircle size={16} />
                  Add Brand
                </button>
              ) : undefined
            }
          />
        </div>
      ) : view === "table" ? (
        <div className="admin-table-card">
          <BrandTable brands={brands} onEdit={openEdit} onDelete={setDeletingBrand} />
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={filters.pageSize}
            onPageChange={(page) => updateFilters({ page })}
            itemLabel="brands"
          />
        </div>
      ) : (
        <>
          <div className="admin-entity-grid">
            {brands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} onEdit={openEdit} onDelete={setDeletingBrand} />
            ))}
          </div>
          <div className="admin-table-card" style={{ boxShadow: "none", border: "none", background: "transparent" }}>
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={filters.pageSize}
              onPageChange={(page) => updateFilters({ page })}
              itemLabel="brands"
            />
          </div>
        </>
      )}

      {modalMode && (
        <BrandFormModal
          title={modalMode === "edit" ? "Edit Brand" : "Add Brand"}
          defaultValues={editingBrand ? brandToFormValues(editingBrand) : emptyBrandFormValues}
          categories={categories}
          submitting={submitting}
          submitLabel={modalMode === "edit" ? "Update Brand" : "Save Brand"}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {deletingBrand && (
        <ConfirmDialog
          title="Delete this brand?"
          message={`You're about to permanently delete "${deletingBrand.name}". This action cannot be undone.`}
          confirmLabel="Delete Brand"
          confirmingLabel="Deleting…"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingBrand(null)}
        />
      )}
    </>
  );
}
