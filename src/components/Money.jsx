/* eslint-disable react-refresh/only-export-components */
/**
 * Pure monetary formatting utility for Indian currency (en-IN).
 * Useful for non-JSX contexts such as tooltips, export documents, and calculations.
 *
 * @param {number|string} amount
 * @param {Object} [options]
 * @param {boolean} [options.showSign=false] - Whether to explicitly prefix positive/debit sign
 * @param {string} [options.currency='₹'] - Currency symbol
 * @param {'credit'|'debit'|'neutral'|'muted'} [options.type] - Semantic color intent
 * @param {number} [options.decimals=2] - Number of fraction digits
 * @returns {string} Formatted currency string, e.g. "₹1,23,456.78", "+₹5,000.00", "−₹450.00"
 */
export function formatMoneyValue(amount, options = {}) {
  const {
    showSign = false,
    currency = '₹',
    type,
    decimals = 2,
  } = options;

  let numericAmount;
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (typeof amount === 'string') {
    const sanitized = amount
      .replace(/[₹$,\s]/g, '')
      .replace(/\u2212/g, '-');
    numericAmount = parseFloat(sanitized);
  } else {
    numericAmount = 0;
  }

  const validAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const isZero = validAmount === 0 || Object.is(validAmount, -0);
  const isNegative = validAmount < 0;
  const absAmount = isZero ? 0 : Math.abs(validAmount);

  let resolvedType = type;
  if (!resolvedType) {
    if (isNegative) {
      resolvedType = 'debit';
    } else if (validAmount > 0 && showSign) {
      resolvedType = 'credit';
    } else {
      resolvedType = 'neutral';
    }
  }

  let sign = '';
  if (!isZero) {
    if (isNegative || (resolvedType === 'debit' && showSign)) {
      sign = '\u2212'; // True minus sign U+2212
    } else if ((validAmount > 0 && showSign) || (resolvedType === 'credit' && showSign)) {
      sign = '+';
    }
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const formattedNumber = formatter.format(absAmount);

  return `${sign}${currency}${formattedNumber}`;
}

/**
 * Money Component for SpendWise
 *
 * Enforces:
 * - Tabular figures (strictly tabular-nums font-sans, monospace prohibited).
 * - True minus sign (U+2212 `−`, not ASCII `-`) for negative amounts.
 * - Indian numbering system (`en-IN` locale) with 2 fraction digits default (or custom decimals).
 * - Format: `₹1,23,456.78` or `+₹1,23,456.78` or `−₹1,23,456.78`.
 * - Semantic color tokens (`text-[var(--credit)]`, `text-[var(--debit)]`, `text-[var(--ink)]`, `text-[var(--ink-3)]`).
 * - Strict type scale: minimum 12px everywhere.
 * - Negative cash warning: triggers inline note and link to BalanceManager when `isCash && amount < 0`.
 *
 * @param {Object} props
 * @param {number|string} props.amount - Monetary value to render (required)
 * @param {'credit'|'debit'|'neutral'|'muted'} [props.type] - Semantic color intent (auto-inferred if omitted)
 * @param {boolean} [props.showSign=false] - Whether to show sign prefix
 * @param {string} [props.currency='₹'] - Currency symbol (default '₹')
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.isCash=false] - Whether this represents a cash balance
 * @param {Function} [props.onOpenBalanceManager] - Callback to open balance manager dialog
 * @param {import('react').ReactNode} [props.subtext] - Optional secondary note/text
 * @param {number} [props.decimals=2] - Number of fraction digits (default 2)
 */
export default function Money({
  amount,
  type,
  showSign = false,
  currency = '₹',
  className = '',
  isCash = false,
  onOpenBalanceManager,
  subtext,
  decimals = 2,
}) {
  let numericAmount;
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (typeof amount === 'string') {
    const sanitized = amount
      .replace(/[₹$,\s]/g, '')
      .replace(/\u2212/g, '-');
    numericAmount = parseFloat(sanitized);
  } else {
    numericAmount = 0;
  }

  const validAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const isZero = validAmount === 0 || Object.is(validAmount, -0);
  const isNegative = validAmount < 0;
  const absAmount = isZero ? 0 : Math.abs(validAmount);

  let resolvedType = type;
  if (!resolvedType) {
    if (isNegative) {
      resolvedType = 'debit';
    } else if (validAmount > 0 && showSign) {
      resolvedType = 'credit';
    } else {
      resolvedType = 'neutral';
    }
  }

  let sign = '';
  if (!isZero) {
    if (isNegative || (resolvedType === 'debit' && showSign)) {
      sign = '\u2212'; // True minus sign U+2212
    } else if ((validAmount > 0 && showSign) || (resolvedType === 'credit' && showSign)) {
      sign = '+';
    }
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const formattedNumber = formatter.format(absAmount);

  const TYPE_COLOR_MAP = {
    credit: 'text-[var(--credit)]',
    debit: 'text-[var(--debit)]',
    neutral: 'text-[var(--ink)]',
    muted: 'text-[var(--ink-3)]',
  };

  const hasExplicitColor = /(^|\s)text-(white|black|inherit|current|transparent|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|\[#[0-9a-fA-F]+\]|\[var\(--)/.test(className);

  const colorClass = (type || !hasExplicitColor)
    ? (TYPE_COLOR_MAP[resolvedType] || 'text-[var(--ink)]')
    : '';

  const isCashWarning = isCash && isNegative;

  const handleAdjustBalance = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onOpenBalanceManager === 'function') {
      onOpenBalanceManager();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spendwise:open-balance-manager'));
    }
  };

  const fullClassName = ['font-sans tabular-nums', colorClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={fullClassName}>
      {sign}{currency}{formattedNumber}
      {subtext ? (
        <span className="ml-1 text-xs text-[var(--ink-3)] font-normal">
          {subtext}
        </span>
      ) : null}
      {isCashWarning ? (
        <span className="inline-flex items-center gap-1.5 ml-2 text-xs font-normal">
          <span className="text-[var(--debit)]">Negative cash</span>
          <button
            type="button"
            onClick={handleAdjustBalance}
            className="text-xs text-[var(--accent)] underline underline-offset-2 hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded-[6px] transition-opacity cursor-pointer"
            title="Open balance manager to adjust cash balance"
          >
            Adjust balance
          </button>
        </span>
      ) : null}
    </span>
  );
}
