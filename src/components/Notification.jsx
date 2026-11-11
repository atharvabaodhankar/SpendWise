import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Toast Notification component for SpendWise
 *
 * Implements Section 5.8:
 * - Bottom-centre on mobile above the tab bar, bottom-left on desktop.
 * - 14px radius, text only with a 2px left border in --credit or --debit.
 * - Auto-dismiss at 4s, pause on hover, role="status".
 */
export default function Notification({
  notification,
  type = 'info',
  message,
  onClose,
  autoClose = true,
  duration = 4000,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const resolvedType = notification?.type || type || 'info';
  const resolvedMessage = notification?.message || message || '';

  const isSuccess = resolvedType === 'success';
  const isError = resolvedType === 'error' || resolvedType === 'danger';

  const borderColor = isSuccess
    ? 'border-l-2 border-l-[var(--credit)]'
    : isError
    ? 'border-l-2 border-l-[var(--debit)]'
    : 'border-l-2 border-l-[var(--accent)]';

  useEffect(() => {
    if (!autoClose || isPaused) return;

    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoClose, duration, isPaused, onClose]);

  if (!isVisible || !resolvedMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed z-50 transition-all duration-180 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 sm:left-6 sm:bottom-6 sm:translate-x-0 max-w-[90vw] sm:max-w-md`}
    >
      <div
        className={`bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] ${borderColor} rounded-[14px] shadow-[var(--shadow-pop)] py-3 px-4 flex items-center justify-between gap-3`}
      >
        <span className="text-[13px] font-normal leading-snug">
          {resolvedMessage}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 180);
            }}
            className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
