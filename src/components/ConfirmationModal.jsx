import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-md rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[6px] bg-[var(--sunken)] flex items-center justify-center flex-shrink-0 ${
              isDangerous ? 'text-[var(--debit)]' : 'text-[var(--accent)]'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[var(--ink)]">{title}</h3>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
          <button
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`text-xs ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
