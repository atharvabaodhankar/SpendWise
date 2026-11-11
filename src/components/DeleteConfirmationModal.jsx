import { AlertTriangle, X } from 'lucide-react';
import Money from './Money';

export default function DeleteConfirmationModal({ transaction, onConfirm, onCancel }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--sunken)] flex items-center justify-center text-[var(--debit)] flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[var(--ink)]">
                Delete transaction
              </h3>
              <p className="text-xs text-[var(--ink-3)]">This action cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction summary */}
        <div className="p-3.5 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[var(--ink)]">
              {transaction.description || transaction.category}
            </span>
            <Money amount={transaction.amount} type={transaction.type} />
          </div>
          <div className="flex justify-between items-center text-xs text-[var(--ink-3)]">
            <span>{transaction.category} · {transaction.paymentMethod === 'online' ? 'Online' : 'Cash'}</span>
            <span>
              {new Date(transaction.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--ink-3)] leading-relaxed">
          Deleting this transaction will update your account balances accordingly.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
          <button
            onClick={onCancel}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger text-xs"
          >
            Delete transaction
          </button>
        </div>
      </div>
    </div>
  );
}
