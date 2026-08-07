import { useEffect } from "react";
import { useForm } from "react-hook-form";
import ImagePicker from "../common/ImagePicker";
import LoadingSpinner from "../LoadingSpinner";
import { slugify } from "../../utils/slugify";
import type { CategoryFormValues } from "../../types/category";

interface CategoryFormProps {
  defaultValues: CategoryFormValues;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
}

export default function CategoryForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({ defaultValues });

  const name = watch("name");
  const slug = watch("slug");
  const imageUrl = watch("image_url");

  // Keep the slug in sync with the name until the admin edits it manually.
  useEffect(() => {
    if (!defaultValues.slug) {
      setValue("slug", slugify(name || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="admin-form-grid">
        <div className="admin-field admin-field--full">
          <label>
            Category Name <span className="admin-required">*</span>
          </label>
          <input
            className={`admin-plain-input ${errors.name ? "has-error" : ""}`}
            placeholder="e.g. Gaming Laptops"
            {...register("name", { required: "Category name is required" })}
          />
          {errors.name && <span className="admin-field__error">{errors.name.message}</span>}
        </div>

        <div className="admin-field admin-field--full">
          <label>Slug</label>
          <input
            className="admin-plain-input"
            placeholder="auto-generated-from-name"
            value={slug}
            onChange={(e) => setValue("slug", slugify(e.target.value))}
          />
        </div>

        <div className="admin-field">
          <label>Display Order</label>
          <input
            type="number"
            className="admin-plain-input"
            placeholder="0"
            {...register("display_order")}
          />
        </div>

        <div className="admin-field">
          <label>Status</label>
          <select className="admin-select" style={{ width: "100%" }} {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="admin-field admin-field--full">
          <label>Description</label>
          <textarea
            className="admin-textarea"
            placeholder="Short description shown on the category page…"
            {...register("description")}
          />
        </div>
      </div>

      <ImagePicker
        label="Category Image"
        hint="Shown on category cards and the storefront."
        folder="categories"
        value={imageUrl}
        onChange={(url) => setValue("image_url", url)}
      />

      <div className="admin-switch-row">
        <div>
          <div className="admin-switch-row__label">Featured Category</div>
          <div className="admin-switch-row__hint">Highlighted on the homepage.</div>
        </div>
        <label className="admin-switch">
          <input type="checkbox" {...register("featured")} />
          <span className="admin-switch__track" />
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
          {submitting ? <LoadingSpinner size="sm" onAccent /> : null}
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
