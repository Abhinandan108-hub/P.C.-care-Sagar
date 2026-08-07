import { X } from "lucide-react";
import CategoryForm from "./CategoryForm";
import type { CategoryFormValues } from "../../types/category";

interface CategoryFormModalProps {
  title: string;
  defaultValues: CategoryFormValues;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
}

export default function CategoryFormModal({
  title,
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="admin-form-modal">
        <div className="admin-form-modal__head">
          <h3>{title}</h3>
          <button
            type="button"
            className="admin-drawer__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="admin-form-modal__body">
          <CategoryForm
            defaultValues={defaultValues}
            submitting={submitting}
            submitLabel={submitLabel}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
