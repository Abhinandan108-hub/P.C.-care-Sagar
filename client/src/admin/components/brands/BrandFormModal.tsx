import { X } from "lucide-react";
import BrandForm from "./BrandForm";
import type { BrandFormValues } from "../../types/brand";
import type { NamedOption } from "../../types/product";

interface BrandFormModalProps {
  title: string;
  defaultValues: BrandFormValues;
  categories: NamedOption[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: BrandFormValues) => void;
  onClose: () => void;
}

export default function BrandFormModal({
  title,
  defaultValues,
  categories,
  submitting,
  submitLabel,
  onSubmit,
  onClose,
}: BrandFormModalProps) {
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
          <BrandForm
            defaultValues={defaultValues}
            categories={categories}
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
