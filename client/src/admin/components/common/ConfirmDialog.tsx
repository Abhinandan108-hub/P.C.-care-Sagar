import { AlertTriangle } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  busy: boolean;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  confirmingLabel = "Deleting…",
  busy,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="admin-modal" role="alertdialog" aria-modal="true">
        <div className="admin-modal__icon">
          <AlertTriangle size={22} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal__foot">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`admin-btn ${tone === "danger" ? "admin-btn--danger" : "admin-btn--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <LoadingSpinner size="sm" onAccent /> : null}
            {busy ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
