import { useNavigate } from "react-router-dom";
import { Eye, ImageOff, Pencil, Star, Trash2 } from "lucide-react";
import type { Product } from "../../types/product";

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function StatusBadge({ status }: { status: Product["status"] }) {
  return status === "active" ? (
    <span className="admin-badge admin-badge--green admin-badge--dot">Active</span>
  ) : (
    <span className="admin-badge admin-badge--gray admin-badge--dot">Inactive</span>
  );
}

export default function ProductTable({
  products,
  onView,
  onDelete,
}: ProductTableProps) {
  const navigate = useNavigate();

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th>Price</th>
            <th>MRP</th>
            <th>Offer %</th>
            <th>Featured</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                {product.image_url ? (
                  <img
                    className="admin-table__thumb"
                    src={product.image_url}
                    alt={product.name}
                  />
                ) : (
                  <div className="admin-table__thumb-fallback">
                    <ImageOff size={16} />
                  </div>
                )}
              </td>
              <td>
                <div className="admin-table__name" title={product.name}>
                  {product.name}
                </div>
              </td>
              <td>{product.brand}</td>
              <td>{product.category}</td>
              <td className="admin-table__price">{inr.format(product.price)}</td>
              <td className="admin-table__mrp">{inr.format(product.mrp)}</td>
              <td>
                {product.offer_percentage > 0 ? (
                  <span className="admin-badge admin-badge--amber">
                    {product.offer_percentage}% OFF
                  </span>
                ) : (
                  <span style={{ color: "var(--a-muted)" }}>—</span>
                )}
              </td>
              <td>
                {product.featured ? (
                  <span className="admin-badge admin-badge--blue">
                    <Star size={11} style={{ marginRight: 3, display: "inline" }} />
                    Featured
                  </span>
                ) : (
                  <span style={{ color: "var(--a-muted)" }}>—</span>
                )}
              </td>
              <td>
                <StatusBadge status={product.status} />
              </td>
              <td>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => onView(product)}
                    aria-label={`View ${product.name}`}
                    title="View"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                    aria-label={`Edit ${product.name}`}
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => onDelete(product)}
                    aria-label={`Delete ${product.name}`}
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
