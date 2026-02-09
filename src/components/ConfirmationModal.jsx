import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--primary-900)]/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-scale">
      <div className="premium-card w-full max-w-md animate-slide-up shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-2 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-[var(--primary-100)] text-[var(--primary-600)]'}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-[var(--text-secondary)] text-sm">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 btn-secondary justify-center"
            >
                {cancelText}
            </button>
            <button
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={`flex-1 flex justify-center items-center ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            >
                {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
}
