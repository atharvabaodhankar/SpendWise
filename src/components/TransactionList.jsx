import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Money from './Money';
import CustomSelect from './CustomSelect';

const PAGE_SIZE = 20;

/**
 * Safely parse a date value into a Date object representing the local calendar day.
 */
function parseLocalDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    try {
      const d = dateVal.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const d = parseInt(match[3], 10);
      return new Date(y, m, d);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format a date string into "Today", "Yesterday", or human friendly "10 November 2026"
 */
function getDayHeading(dateString) {
  if (!dateString) return 'Undated';
  const d = parseLocalDate(dateString);
  if (!d) return String(dateString);

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function getDateKey(dateString) {
  if (!dateString) return 'undated';
  const d = parseLocalDate(dateString);
  if (!d) return String(dateString).split('T')[0] || String(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TransactionList({
  transactions = [],
  onDelete,
  onOpenAddExpense,
  onOpenAgentConnect,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'expense', 'income'
  const [selectedMethod, setSelectedMethod] = useState('all'); // 'all', 'online', 'cash'
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Track initial transaction IDs so only truly newly inserted rows get row-flash
  const initialIdsRef = useRef(null);
  if (initialIdsRef.current === null && transactions.length > 0) {
    initialIdsRef.current = new Set(transactions.map((t) => t.id));
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedMethod !== 'all') {
        const isCash = (t.paymentMethod || '').toLowerCase() === 'cash';
        if (selectedMethod === 'cash' && !isCash) return false;
        if (selectedMethod === 'online' && isCash) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        return desc.includes(q) || cat.includes(q);
      }
      return true;
    });
  }, [transactions, selectedType, selectedMethod, searchQuery]);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedMethod]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Sliced paginated transactions (20 per page)
  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, safeCurrentPage]);

  // Group visible paginated transactions by day (sorted newest first)
  const groupedDays = useMemo(() => {
    const groups = {};
    paginatedTransactions.forEach((t) => {
      const key = getDateKey(t.date);
      if (!groups[key]) {
        groups[key] = {
          dateKey: key,
          heading: getDayHeading(t.date),
          items: [],
          netAmount: 0,
        };
      }
      groups[key].items.push(t);
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        groups[key].netAmount += amt;
      } else {
        groups[key].netAmount -= amt;
      }
    });

    return Object.values(groups);
  }, [paginatedTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
        <p className="text-sm text-[var(--ink-2)]">
          No transactions yet. Add your first expense or message your AI agent.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="btn btn-primary text-xs h-9 px-4 cursor-pointer"
          >
            Add expense
          </button>
          <button
            type="button"
            onClick={onOpenAgentConnect}
            className="btn btn-quiet text-xs h-9 px-4 cursor-pointer"
          >
            Connect an agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HEADER / SEARCH & FILTER ── */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <h2 className="text-[17px] font-semibold text-[var(--ink)]">
          Transactions
        </h2>

        {/* Desktop Search & Filters (>=1024px) */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--ink-3)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="field h-8 pl-[32px] pr-3 text-xs w-48 rounded-[6px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)]"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <CustomSelect
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 px-2.5 text-xs w-32"
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </CustomSelect>

          <CustomSelect
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="h-8 px-2.5 text-xs w-32"
            aria-label="Filter by wallet"
          >
            <option value="all">All wallets</option>
            <option value="online">Online</option>
            <option value="cash">Cash</option>
          </CustomSelect>
        </div>

        {/* Mobile Filter Trigger (<1024px) */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="btn btn-quiet h-8 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            aria-label="Open filter sheet"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              Filter
              {selectedType !== 'all' || selectedMethod !== 'all' || searchQuery ? ' (1)' : ''}
            </span>
          </button>
        </div>
      </div>

      {/* ── MOBILE FILTER BOTTOM SHEET ── */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="w-full sm:max-w-md bg-[var(--surface)] rounded-t-[14px] sm:rounded-[14px] border border-[var(--line)] shadow-[var(--shadow-pop)] p-5 space-y-4 max-h-[85dvh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Filter transactions"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-base font-semibold text-[var(--ink)]">Filter transactions</h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)]"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="field-label">Search description or category</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Coffee, Salary..."
                  className="field text-sm"
                />
              </div>

              <div>
                <label className="field-label">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'expense', 'income'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`btn h-10 text-xs ${
                        selectedType === t ? 'btn-primary' : 'btn-quiet'
                      }`}
                    >
                      {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'online', 'cash'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMethod(m)}
                      className={`btn h-10 text-xs ${
                        selectedMethod === m ? 'btn-primary' : 'btn-quiet'
                      }`}
                    >
                      {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedMethod('all');
                }}
                className="btn btn-quiet flex-1 text-xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="btn btn-primary flex-1 text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPTY FILTER RESULTS ── */}
      {groupedDays.length === 0 && (
        <div className="py-12 text-center text-xs text-[var(--ink-3)]">
          No transactions match your filters.
        </div>
      )}

      {/* ── DAY-GROUPED LEDGER ── */}
      <div className="divide-y divide-[var(--line)]">
        {groupedDays.map((group) => (
          <div key={group.dateKey} className="group-day">
            {/* Sticky Date Header: 13px, --ink-3, --bg background */}
            <div className="sticky top-14 z-20 bg-[var(--bg)]/95 backdrop-blur-sm py-2 flex items-center justify-between text-[13px] text-[var(--ink-3)] border-b border-[var(--line)]">
              <span className="font-medium text-[var(--ink-2)]">{group.heading}</span>
              <span className="tabular-nums">
                <Money
                  amount={group.netAmount}
                  showSign
                  className="text-[13px] text-[var(--ink-3)]"
                />
              </span>
            </div>

            {/* Transaction Rows */}
            <div className="divide-y divide-[var(--line)]">
              {group.items.map((transaction) => {
                const isExpense = transaction.type === 'expense';
                const signedAmount = isExpense
                  ? -Math.abs(Number(transaction.amount) || 0)
                  : Math.abs(Number(transaction.amount) || 0);

                const methodLabel = transaction.paymentMethod || 'Online';
                const categoryLabel = transaction.category || 'Other';

                const splitCount =
                  transaction.splitDetails?.length ||
                  (transaction.splitWith ? transaction.splitWith.length : 0);
                const isSplit = Boolean(transaction.isSplit || splitCount > 0);

                const isNewlyInserted =
                  Boolean(transaction.isNew) ||
                  (initialIdsRef.current && !initialIdsRef.current.has(transaction.id));

                return (
                  <div
                    key={transaction.id}
                    className={`min-h-[56px] py-3 flex items-center justify-between gap-3 transition-colors ${
                      isNewlyInserted ? 'row-flash bg-[var(--accent-soft)]' : 'hover:bg-[var(--sunken)]/40'
                    }`}
                  >
                    {/* Left: Description + Second Line (Category · Method · Split) */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-medium text-[var(--ink)] truncate leading-snug">
                        {transaction.description || transaction.category || 'Untitled expense'}
                      </div>
                      <div className="text-[13px] text-[var(--ink-3)] truncate mt-0.5 leading-none">
                        <span>{categoryLabel}</span>
                        <span className="mx-1.5 opacity-60">·</span>
                        <span>{methodLabel}</span>
                        {isSplit && (
                          <>
                            <span className="mx-1.5 opacity-60">·</span>
                            <span>Split with {splitCount || 2}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount + Delete Button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <Money
                          amount={signedAmount}
                          showSign
                          className="text-[15px] font-medium"
                        />
                      </div>

                      {/* Always-visible Delete Trash Button (touch target min 40px) */}
                      <button
                        type="button"
                        onClick={() => onDelete?.(transaction)}
                        aria-label={`Delete transaction: ${transaction.description || transaction.category || 'expense'}`}
                        className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[6px] text-[var(--ink-3)] hover:text-[var(--debit)] hover:bg-[var(--sunken)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {filteredTransactions.length > 0 && (
        <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink-2)]">
          <div>
            <span>
              Page {safeCurrentPage} of {totalPages}
            </span>
            <span className="text-[var(--ink-3)] ml-1">
              ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage <= 1}
              className="btn btn-quiet h-9 px-3 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="btn btn-quiet h-9 px-3 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
