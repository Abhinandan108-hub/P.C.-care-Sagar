import { FolderTree, Pencil, Star, Trash2 } from "lucide-react";
import type { Category } from "../../types/category";

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function StatusBadge({ status }: { status: Category["status"] }) {
  return status === "active" ? (
    <span className="admin-badge admin-badge--green admin-badge--dot">Active</span>
  ) : (
    <span className="admin-badge admin-badge--gray admin-badge--dot">Inactive</span>
  );
}

export default function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Category Name</th>
            <th>Slug</th>
            <th>Order</th>
            <th>Products</th>
            <th>Featured</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                {category.image_url ? (
                  <img className="admin-table__thumb" src={category.image_url} alt={category.name} />
                ) : (
                  <div className="admin-table__thumb-fallback">
                    <FolderTree size={16} />
                  </div>
                )}
              </td>
              <td>
                <div className="admin-table__name" title={category.name}>
                  {category.name}
                </div>
              </td>
              <td style={{ color: "var(--a-muted)" }}>{category.slug}</td>
              <td>{category.display_order}</td>
              <td>{category.product_count}</td>
              <td>
                {category.featured ? (
                  <span className="admin-badge admin-badge--blue">
                    <Star size={11} style={{ marginRight: 3, display: "inline" }} />
                    Featured
                  </span>
                ) : (
                  <span style={{ color: "var(--a-muted)" }}>—</span>
                )}
              </td>
              <td>
                <StatusBadge status={category.status} />
              </td>
              <td>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => onEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    title="Edit"
                  >
                    <Pencil size={15} />
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
