import { useState } from "react";
import toast from "react-hot-toast";
import { FolderTree, PlusCircle } from "lucide-react";
import SearchBar from "../components/common/SearchBar";
import Pagination from "../components/common/Pagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ViewToggle from "../components/common/ViewToggle";
import type { ViewMode } from "../components/common/ViewToggle";
import CategoryTable from "../components/categories/CategoryTable";
import CategoryCard from "../components/categories/CategoryCard";
import CategoryFormModal from "../components/categories/CategoryFormModal";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useCategories } from "../hooks/useCategories";
import { createCategory, deleteCategory, updateCategory } from "../services/categoryService";
import {
  categoryToFormValues,
  DEFAULT_CATEGORY_FILTERS,
  emptyCategoryFormValues,
} from "../types/category";
import type { Category, CategoryFilters, CategoryFormValues } from "../types/category";

export default function Categories() {
  const [filters, setFilters] = useState<CategoryFilters>(DEFAULT_CATEGORY_FILTERS);
  const [view, setView] = useState<ViewMode>("cards");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { categories, totalCount, totalPages, loading, error, refetch } = useCategories(filters);

  function updateFilters(patch: Partial<CategoryFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function openAdd() {
    setEditingCategory(null);
    setModalMode("add");
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setModalMode("edit");
  }

  function closeModal() {
    if (submitting) return;
    setModalMode(null);
    setEditingCategory(null);
  }

  async function handleSubmit(values: CategoryFormValues) {
    setSubmitting(true);
    try {
      if (modalMode === "edit" && editingCategory) {
        await updateCategory(editingCategory.id, values);
        toast.success("Category Updated Successfully");
      } else {
        await createCategory(values);
        toast.success("Category Added Successfully");
      }
      setModalMode(null);
      setEditingCategory(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await deleteCategory(deletingCategory);
      toast.success("Category Deleted Successfully");
      setDeletingCategory(null);
      refetch();
    } catch {
      toast.error("Database Error");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(filters.search || filters.status);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Categories</h1>
          <p>Organize your catalog into browsable categories.</p>
        </div>
        <div className="admin-page-head__actions">
          <button className="admin-btn admin-btn--primary" style={{ width: "auto" }} onClick={openAdd}>
            <PlusCircle size={16} />
            Add Category
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <SearchBar
          value={filters.search}
          onChange={(search) => updateFilters({ search, page: 1 })}
          placeholder="Search by name or slug…"
          ariaLabel="Search categories"
        />
        <div className="admin-filter-bar">
          <select
            className="admin-select"
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value as CategoryFilters["status"], page: 1 })}
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
          <LoadingSpinner label="Loading categories…" />
        </div>
      ) : error ? (
        <div className="admin-table-card">
          <EmptyState icon={FolderTree} title="Couldn't load categories" description={error} />
        </div>
      ) : categories.length === 0 ? (
        <div className="admin-table-card">
          <EmptyState
            icon={FolderTree}
            title={hasFilters ? "No categories match your filters" : "No categories yet"}
            description={
              hasFilters ? "Try adjusting or resetting your search and filters." : "Add your first category to get started."
            }
            action={
              !hasFilters ? (
                <button className="admin-btn admin-btn--primary" style={{ width: "auto", marginTop: 6 }} onClick={openAdd}>
                  <PlusCircle size={16} />
                  Add Category
                </button>
              ) : undefined
            }
          />
        </div>
      ) : view === "table" ? (
        <div className="admin-table-card">
          <CategoryTable categories={categories} onEdit={openEdit} onDelete={setDeletingCategory} />
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={filters.pageSize}
            onPageChange={(page) => updateFilters({ page })}
            itemLabel="categories"
          />
        </div>
      ) : (
        <>
          <div className="admin-entity-grid">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} onEdit={openEdit} onDelete={setDeletingCategory} />
            ))}
          </div>
          <div className="admin-table-card" style={{ boxShadow: "none", border: "none", background: "transparent" }}>
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={filters.pageSize}
              onPageChange={(page) => updateFilters({ page })}
              itemLabel="categories"
            />
          </div>
        </>
      )}

      {modalMode && (
        <CategoryFormModal
          title={modalMode === "edit" ? "Edit Category" : "Add Category"}
          defaultValues={editingCategory ? categoryToFormValues(editingCategory) : emptyCategoryFormValues}
          submitting={submitting}
          submitLabel={modalMode === "edit" ? "Update Category" : "Save Category"}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {deletingCategory && (
        <ConfirmDialog
          title="Delete this category?"
          message={`You're about to permanently delete "${deletingCategory.name}". This action cannot be undone.`}
          confirmLabel="Delete Category"
          confirmingLabel="Deleting…"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </>
  );
}
