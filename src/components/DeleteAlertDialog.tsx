import type { Alert } from "../types";

interface DeleteAlertDialogProps {
  alert: Alert;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteAlertDialog({
  alert,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteAlertDialogProps) {
  return (
    <div className="alert-form-overlay" onClick={onCancel}>
      <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="delete-dialog-header">
          <h3>Delete Alert</h3>
        </div>
        <div className="delete-dialog-body">
          <p>
            Are you sure you want to delete this alert for{" "}
            <strong>{alert.symbol}</strong>?
          </p>
          <div className="alert-summary">
            <div>
              <span className="label">Direction:</span>
              <span>{alert.direction === "above" ? "↑ Above" : "↓ Below"}</span>
            </div>
            <div>
              <span className="label">Threshold:</span>
              <span>${alert.threshold.toFixed(2)}</span>
            </div>
            <div>
              <span className="label">Channel:</span>
              <span>{alert.channel}</span>
            </div>
          </div>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
        <div className="delete-dialog-actions">
          <button
            type="button"
            className="ghost"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}

