import { Pencil, Star, Tag, Trash2 } from "lucide-react";
import type { Brand } from "../../types/brand";

interface BrandCardProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export default function BrandCard({ brand, onEdit, onDelete }: BrandCardProps) {
  return (
    <div className="admin-entity-card">
      <div className="admin-entity-card__media admin-entity-card__media--logo">
        {brand.image_url ? (
          <img src={brand.image_url} alt={brand.name} />
        ) : brand.logo_url ? (
          <img src={brand.logo_url} alt={brand.name} style={{ objectFit: "contain", padding: 18 }} />
        ) : (
          <div className="admin-entity-card__media-fallback">
            <Tag size={26} />
          </div>
        )}
        {brand.featured ? (
          <span className="admin-entity-card__ribbon">
            <Star size={11} />
            Featured
          </span>
        ) : null}
      </div>

      <div className="admin-entity-card__body">
        <div className="admin-entity-card__title-row">
          <h4 title={brand.name}>{brand.name}</h4>
          {brand.status === "active" ? (
            <span className="admin-badge admin-badge--green admin-badge--dot">Active</span>
          ) : (
            <span className="admin-badge admin-badge--gray admin-badge--dot">Inactive</span>
          )}
        </div>
        <p className="admin-entity-card__meta">{brand.category_name ?? "No category mapped"}</p>
        {brand.description ? <p className="admin-entity-card__desc">{brand.description}</p> : null}
      </div>

      <div className="admin-entity-card__foot">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onEdit(brand)}>
          <Pencil size={14} />
          Edit
        </button>
        <button
          type="button"
          className="admin-action-btn admin-action-btn--danger"
          onClick={() => onDelete(brand)}
          aria-label={`Delete ${brand.name}`}
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
