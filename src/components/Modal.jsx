import { useEffect, useRef, useId, useCallback } from 'react';
import { X } from 'lucide-react';

const MAX_WIDTH_MAP = {
  sm: 'max-w-[400px] sm:max-w-[400px]',
  md: 'max-w-[520px] sm:max-w-[520px]',
  lg: 'max-w-[720px] sm:max-w-[720px]',
};

/**
 * Canonical Modal & Bottom Sheet Primitive for SpendWise.
 *
 * Desktop (>=640px): Centered dialog with 14px radius, 1px line border, backdrop blur scrim.
 * Mobile (<640px): Bottom sheet docked to bottom, rounded-t-[14px], max-h-[92dvh], overflow-y-auto.
 *
 * Features:
 * - Focus trap (tab looping)
 * - Body scroll lock (restores previous overflow on close/unmount)
 * - Escape key dismissal
 * - Backdrop click dismissal
 * - Accessible close button (min 44x44px touch target)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  className = '',
}) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);
  const titleId = useId();

  // Escape key and tab trapping
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = dialog.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  // Body scroll lock & focus management
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element or the dialog itself
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Window keydown listener
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const maxWidthClass = MAX_WIDTH_MAP[maxWidth] || MAX_WIDTH_MAP.md;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      role="presentation"
      data-testid="modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClass} bg-[var(--surface)] border border-[var(--line)] shadow-2xl flex flex-col overflow-hidden max-h-[92dvh] rounded-t-[14px] rounded-b-none sm:rounded-[14px] sm:max-h-[85vh] focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-[var(--surface)] shrink-0">
          {title ? (
            <h2 id={titleId} className="text-sm font-semibold text-[var(--ink)]">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-[var(--ink)] text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
