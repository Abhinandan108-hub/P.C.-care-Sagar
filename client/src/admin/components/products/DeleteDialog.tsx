import { AlertTriangle } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";
import type { Product } from "../../types/product";

interface DeleteDialogProps {
  product: Product;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDialog({
  product,
  deleting,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onCancel();
      }}
    >
      <div className="admin-modal" role="alertdialog" aria-modal="true">
        <div className="admin-modal__icon">
          <AlertTriangle size={22} />
        </div>
        <h3>Delete this product?</h3>
        <p>
          You're about to permanently delete <strong>{product.name}</strong>{" "}
          and all of its images. This action cannot be undone.
        </p>
        <div className="admin-modal__foot">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <LoadingSpinner size="sm" onAccent /> : null}
            {deleting ? "Deleting…" : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
