import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import LoadingSpinner from "../LoadingSpinner";
import type { NamedOption, ProductFormValues } from "../../types/product";

interface ProductFormProps {
  defaultValues: ProductFormValues;
  categories: NamedOption[];
  brands: NamedOption[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export default function ProductForm({
  defaultValues,
  categories,
  brands,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({ defaultValues });

  const specFields = useFieldArray({ control, name: "specifications" });
  const highlightFields = useFieldArray({ control, name: "highlights" });

  const price = watch("price");
  const mrp = watch("mrp");
  const imageUrl = watch("image_url");
  const galleryImages = watch("gallery_images");

  // Auto-calculate offer % whenever price/MRP change.
  useEffect(() => {
    const p = Number(price);
    const m = Number(mrp);
    if (m > 0 && p >= 0 && p <= m) {
      const pct = Math.round(((m - p) / m) * 100);
      setValue("offer_percentage", pct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, mrp]);

  function submit(values: ProductFormValues) {
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      {/* ---------- Basic Information ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Basic Information</div>
        <div className="admin-form-card__sub">Core details shown across the catalog and product cards.</div>

        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <label>
              Product Name <span className="admin-required">*</span>
            </label>
            <input
              className={`admin-plain-input ${errors.name ? "has-error" : ""}`}
              placeholder="e.g. HP Pavilion 15 Laptop"
              {...register("name", { required: "Product name is required" })}
            />
            {errors.name && <span className="admin-field__error">{errors.name.message}</span>}
          </div>

          <div className="admin-field">
            <label>
              Category <span className="admin-required">*</span>
            </label>
            <input
              className={`admin-plain-input ${errors.category ? "has-error" : ""}`}
              placeholder="e.g. Laptops"
              list="admin-categories-list"
              {...register("category", { required: "Category is required" })}
            />
            <datalist id="admin-categories-list">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {errors.category && <span className="admin-field__error">{errors.category.message}</span>}
          </div>

          <div className="admin-field">
            <label>
              Brand <span className="admin-required">*</span>
            </label>
            <input
              className={`admin-plain-input ${errors.brand ? "has-error" : ""}`}
              placeholder="e.g. HP"
              list="admin-brands-list"
              {...register("brand", { required: "Brand is required" })}
            />
            <datalist id="admin-brands-list">
              {brands.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
            {errors.brand && <span className="admin-field__error">{errors.brand.message}</span>}
          </div>

          <div className="admin-field admin-field--full">
            <label>Description</label>
            <textarea
              className="admin-textarea"
              placeholder="Short description shown on the product page…"
              {...register("description")}
            />
          </div>
        </div>
      </div>

      {/* ---------- Pricing ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Pricing</div>
        <div className="admin-form-card__sub">Displayed to customers — this is not an e-commerce checkout price.</div>

        <div className="admin-form-grid admin-form-grid--3">
          <div className="admin-field">
            <label>
              Price (₹) <span className="admin-required">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`admin-plain-input ${errors.price ? "has-error" : ""}`}
              placeholder="0.00"
              {...register("price", {
                required: "Price is required",
                min: { value: 0, message: "Price cannot be negative" },
              })}
            />
            {errors.price && <span className="admin-field__error">{errors.price.message}</span>}
          </div>

          <div className="admin-field">
            <label>
              MRP (₹) <span className="admin-required">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`admin-plain-input ${errors.mrp ? "has-error" : ""}`}
              placeholder="0.00"
              {...register("mrp", {
                required: "MRP is required",
                min: { value: 0, message: "MRP cannot be negative" },
              })}
            />
            {errors.mrp && <span className="admin-field__error">{errors.mrp.message}</span>}
          </div>

          <div className="admin-field">
            <label>Offer Percentage (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="admin-plain-input"
              placeholder="Auto-calculated"
              {...register("offer_percentage")}
            />
          </div>
        </div>
      </div>

      {/* ---------- Specifications ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Specifications</div>
        <div className="admin-form-card__sub">Key hardware details shown on the product page.</div>

        <div className="admin-form-grid admin-form-grid--3">
          <div className="admin-field">
            <label>Processor</label>
            <input className="admin-plain-input" placeholder="e.g. Intel Core i5-1235U" {...register("processor")} />
          </div>
          <div className="admin-field">
            <label>RAM</label>
            <input className="admin-plain-input" placeholder="e.g. 16GB DDR4" {...register("ram")} />
          </div>
          <div className="admin-field">
            <label>Storage</label>
            <input className="admin-plain-input" placeholder="e.g. 512GB SSD" {...register("storage")} />
          </div>
          <div className="admin-field">
            <label>Graphics</label>
            <input className="admin-plain-input" placeholder="e.g. Intel Iris Xe" {...register("graphics")} />
          </div>
          <div className="admin-field">
            <label>Display Size</label>
            <input className="admin-plain-input" placeholder="e.g. 15.6-inch FHD" {...register("display_size")} />
          </div>
          <div className="admin-field">
            <label>Operating System</label>
            <input className="admin-plain-input" placeholder="e.g. Windows 11 Home" {...register("operating_system")} />
          </div>
          <div className="admin-field">
            <label>Warranty</label>
            <input className="admin-plain-input" placeholder="e.g. 1 Year Onsite" {...register("warranty")} />
          </div>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--a-ink-soft)", margin: "14px 0 8px" }}>
          Additional Specifications
        </label>
        <div className="admin-repeater">
          {specFields.fields.map((field, idx) => (
            <div className="admin-repeater__row" key={field.id}>
              <input
                className="admin-plain-input"
                placeholder="Label (e.g. Weight)"
                {...register(`specifications.${idx}.key` as const)}
              />
              <input
                className="admin-plain-input"
                placeholder="Value (e.g. 1.4 kg)"
                {...register(`specifications.${idx}.value` as const)}
              />
              <button
                type="button"
                className="admin-repeater__remove"
                onClick={() => specFields.remove(idx)}
                aria-label="Remove specification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-repeater__add"
          onClick={() => specFields.append({ key: "", value: "" })}
        >
          <Plus size={14} />
          Add Specification
        </button>
      </div>

      {/* ---------- Highlights ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Product Highlights</div>
        <div className="admin-form-card__sub">Short bullet points shown as key selling points.</div>

        <div className="admin-repeater">
          {highlightFields.fields.map((field, idx) => (
            <div className="admin-repeater__row" key={field.id}>
              <input
                className="admin-plain-input"
                placeholder="e.g. Backlit keyboard with fingerprint reader"
                {...register(`highlights.${idx}.value` as const)}
              />
              <button
                type="button"
                className="admin-repeater__remove"
                onClick={() => highlightFields.remove(idx)}
                aria-label="Remove highlight"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="admin-repeater__add"
          onClick={() => highlightFields.append({ value: "" })}
        >
          <Plus size={14} />
          Add Highlight
        </button>
      </div>

      {/* ---------- Images ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Images</div>
        <div className="admin-form-card__sub">The first image is used as the primary product photo.</div>

        <ImageUploader
          label="Product Image"
          hint="This is the main image shown in the product list and cards."
          images={imageUrl ? [imageUrl] : []}
          onChange={(imgs) => setValue("image_url", imgs[0] ?? null)}
          multiple={false}
        />

        <ImageUploader
          label="Gallery Images"
          hint="Additional photos shown on the product detail page (up to 8)."
          images={galleryImages ?? []}
          onChange={(imgs) => setValue("gallery_images", imgs)}
          multiple
          maxFiles={8}
        />
      </div>

      {/* ---------- Visibility ---------- */}
      <div className="admin-form-card">
        <div className="admin-form-card__title">Visibility &amp; Availability</div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Availability</label>
            <select className="admin-select" style={{ width: "100%" }} {...register("availability")}>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          <div className="admin-field">
            <label>Status</label>
            <select className="admin-select" style={{ width: "100%" }} {...register("status")}>
              <option value="active">Active (visible on website)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </div>
        </div>

        <div className="admin-switch-row">
          <div>
            <div className="admin-switch-row__label">Featured Product</div>
            <div className="admin-switch-row__hint">Shown in the homepage featured products section.</div>
          </div>
          <label className="admin-switch">
            <input type="checkbox" {...register("featured")} />
            <span className="admin-switch__track" />
          </label>
        </div>

        <div className="admin-switch-row">
          <div>
            <div className="admin-switch-row__label">Latest Product</div>
            <div className="admin-switch-row__hint">Marked as a new arrival on the website.</div>
          </div>
          <label className="admin-switch">
            <input type="checkbox" {...register("latest")} />
            <span className="admin-switch__track" />
          </label>
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={onCancel}
          disabled={submitting}
        >
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
