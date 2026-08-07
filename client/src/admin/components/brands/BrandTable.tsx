import { Pencil, Star, Tag, Trash2 } from "lucide-react";
import type { Brand } from "../../types/brand";

interface BrandTableProps {
  brands: Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

function StatusBadge({ status }: { status: Brand["status"] }) {
  return status === "active" ? (
    <span className="admin-badge admin-badge--green admin-badge--dot">Active</span>
  ) : (
    <span className="admin-badge admin-badge--gray admin-badge--dot">Inactive</span>
  );
}

export default function BrandTable({ brands, onEdit, onDelete }: BrandTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Brand Name</th>
            <th>Category</th>
            <th>Featured</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td>
                {brand.logo_url ? (
                  <img className="admin-table__thumb" src={brand.logo_url} alt={brand.name} />
                ) : (
                  <div className="admin-table__thumb-fallback">
                    <Tag size={16} />
                  </div>
                )}
              </td>
              <td>
                <div className="admin-table__name" title={brand.name}>
                  {brand.name}
                </div>
              </td>
              <td>{brand.category_name ?? <span style={{ color: "var(--a-muted)" }}>—</span>}</td>
              <td>
                {brand.featured ? (
                  <span className="admin-badge admin-badge--blue">
                    <Star size={11} style={{ marginRight: 3, display: "inline" }} />
                    Featured
                  </span>
                ) : (
                  <span style={{ color: "var(--a-muted)" }}>—</span>
                )}
              </td>
              <td>
                <StatusBadge status={brand.status} />
              </td>
              <td>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => onEdit(brand)}
                    aria-label={`Edit ${brand.name}`}
                    title="Edit"
                  >
                    <Pencil size={15} />
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
