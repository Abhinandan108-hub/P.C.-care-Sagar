import { useForm } from "react-hook-form";
import ImagePicker from "../common/ImagePicker";
import LoadingSpinner from "../LoadingSpinner";
import type { BrandFormValues } from "../../types/brand";
import type { NamedOption } from "../../types/product";

interface BrandFormProps {
  defaultValues: BrandFormValues;
  categories: NamedOption[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: BrandFormValues) => void;
  onCancel: () => void;
}

export default function BrandForm({
  defaultValues,
  categories,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: BrandFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BrandFormValues>({ defaultValues });

  const logoUrl = watch("logo_url");
  const imageUrl = watch("image_url");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="admin-form-grid">
        <div className="admin-field admin-field--full">
          <label>
            Brand Name <span className="admin-required">*</span>
          </label>
          <input
            className={`admin-plain-input ${errors.name ? "has-error" : ""}`}
            placeholder="e.g. HP"
            {...register("name", { required: "Brand name is required" })}
          />
          {errors.name && <span className="admin-field__error">{errors.name.message}</span>}
        </div>

        <div className="admin-field">
          <label>Category Mapping</label>
          <select className="admin-select" style={{ width: "100%" }} {...register("category_id")}>
            <option value="">No specific category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
            placeholder="Short description of the brand…"
            {...register("description")}
          />
        </div>
      </div>

      <ImagePicker
        label="Brand Logo"
        hint="Square logo, shown in brand lists and the storefront filter bar."
        folder="brands"
        value={logoUrl}
        onChange={(url) => setValue("logo_url", url)}
      />

      <ImagePicker
        label="Brand Image"
        hint="Wider banner-style image, shown on the brand's dedicated page."
        folder="brands"
        value={imageUrl}
        onChange={(url) => setValue("image_url", url)}
      />

      <div className="admin-switch-row">
        <div>
          <div className="admin-switch-row__label">Featured Brand</div>
          <div className="admin-switch-row__hint">Highlighted in the homepage brand strip.</div>
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
