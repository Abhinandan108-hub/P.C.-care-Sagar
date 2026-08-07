import { FolderTree, Pencil, Star, Trash2 } from "lucide-react";
import type { Category } from "../../types/category";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="admin-entity-card">
      <div className="admin-entity-card__media">
        {category.image_url ? (
          <img src={category.image_url} alt={category.name} />
        ) : (
          <div className="admin-entity-card__media-fallback">
            <FolderTree size={26} />
          </div>
        )}
        {category.featured ? (
          <span className="admin-entity-card__ribbon">
            <Star size={11} />
            Featured
          </span>
        ) : null}
      </div>

      <div className="admin-entity-card__body">
        <div className="admin-entity-card__title-row">
          <h4 title={category.name}>{category.name}</h4>
          {category.status === "active" ? (
            <span className="admin-badge admin-badge--green admin-badge--dot">Active</span>
          ) : (
            <span className="admin-badge admin-badge--gray admin-badge--dot">Inactive</span>
          )}
        </div>
        <p className="admin-entity-card__meta">/{category.slug}</p>
        {category.description ? (
          <p className="admin-entity-card__desc">{category.description}</p>
        ) : null}

        <div className="admin-entity-card__stats">
          <span>
            <strong>{category.product_count}</strong> Products
          </span>
          <span>
            Order <strong>{category.display_order}</strong>
          </span>
        </div>
      </div>

      <div className="admin-entity-card__foot">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onEdit(category)}>
          <Pencil size={14} />
          Edit
        </button>
        <button
          type="button"
          className="admin-action-btn admin-action-btn--danger"
          onClick={() => onDelete(category)}
          aria-label={`Delete ${category.name}`}
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
