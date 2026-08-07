import { useNavigate } from "react-router-dom";
import { CheckCircle2, ImageOff, Pencil, X } from "lucide-react";
import type { Product } from "../../types/product";

interface ProductDetailDrawerProps {
  product: Product;
  onClose: () => void;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const availabilityLabel: Record<Product["availability"], string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  coming_soon: "Coming Soon",
};

const specRow = [
  ["Processor", "processor"],
  ["RAM", "ram"],
  ["Storage", "storage"],
  ["Graphics", "graphics"],
  ["Display Size", "display_size"],
  ["Operating System", "operating_system"],
  ["Warranty", "warranty"],
] as const;

export default function ProductDetailDrawer({
  product,
  onClose,
}: ProductDetailDrawerProps) {
  const navigate = useNavigate();

  const keySpecs = specRow.filter(([, key]) => Boolean(product[key]));

  return (
    <>
      <div className="admin-drawer-overlay" onClick={onClose} />
      <aside className="admin-drawer" role="dialog" aria-modal="true">
        <div className="admin-drawer__head">
          <div>
            <h3>{product.name}</h3>
            <span className="admin-badge admin-badge--gray">
              {product.category} • {product.brand}
            </span>
          </div>
          <button
            type="button"
            className="admin-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-drawer__body">
          {product.image_url ? (
            <img
              className="admin-drawer__hero"
              src={product.image_url}
              alt={product.name}
            />
          ) : (
            <div
              className="admin-drawer__hero"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--a-muted)" }}
            >
              <ImageOff />
            </div>
          )}

          {product.gallery_images.length > 0 && (
            <div className="admin-drawer__gallery">
              {product.gallery_images.map((url) => (
                <img key={url} src={url} alt="" />
              ))}
            </div>
          )}

          <div className="admin-drawer__section">
            <div className="admin-drawer__price-row">
              <span className="admin-drawer__price">{inr.format(product.price)}</span>
              {product.mrp > product.price && (
                <span className="admin-drawer__mrp">{inr.format(product.mrp)}</span>
              )}
              {product.offer_percentage > 0 && (
                <span className="admin-badge admin-badge--amber">
                  {product.offer_percentage}% OFF
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span className={`admin-badge ${product.status === "active" ? "admin-badge--green" : "admin-badge--gray"}`}>
                {product.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className="admin-badge admin-badge--blue">
                {availabilityLabel[product.availability]}
              </span>
              {product.featured && <span className="admin-badge admin-badge--amber">Featured</span>}
              {product.latest && <span className="admin-badge admin-badge--gray">Latest</span>}
            </div>
          </div>

          {product.description && (
            <div className="admin-drawer__section">
              <h4>Description</h4>
              <p style={{ fontSize: 13.5, color: "var(--a-ink-soft)", lineHeight: 1.6 }}>
                {product.description}
              </p>
            </div>
          )}

          {keySpecs.length > 0 && (
            <div className="admin-drawer__section">
              <h4>Specifications</h4>
              <div className="admin-spec-list">
                {keySpecs.map(([label, key]) => (
                  <div className="admin-spec-list__item" key={key}>
                    <div className="admin-spec-list__key">{label}</div>
                    <div className="admin-spec-list__value">{product[key]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.specifications.length > 0 && (
            <div className="admin-drawer__section">
              <h4>Additional Specifications</h4>
              <div className="admin-spec-list">
                {product.specifications.map((spec, idx) => (
                  <div className="admin-spec-list__item" key={idx}>
                    <div className="admin-spec-list__key">{spec.key}</div>
                    <div className="admin-spec-list__value">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.highlights.length > 0 && (
            <div className="admin-drawer__section">
              <h4>Product Highlights</h4>
              <ul className="admin-highlight-list">
                {product.highlights.map((h, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={15} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
          >
            <Pencil size={16} />
            Edit Product
          </button>
        </div>
      </aside>
    </>
  );
}
