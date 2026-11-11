import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Trash2, X } from 'lucide-react';
import Money from './Money';
import CustomSelect from './CustomSelect';

/**
 * Format a date string into "Today", "Yesterday", or human friendly "10 November 2026"
 */
function getDayHeading(dateString) {
  if (!dateString) return 'Undated';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

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
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString.split('T')[0] || dateString;
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
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Close overflow menu on outside click or Esc
  useEffect(() => {
    if (!activeMenuId) return;
    const handleDown = (e) => {
      if (!e.target.closest('[data-menu-container]')) {
        setActiveMenuId(null);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [activeMenuId]);

  // Track initial transaction IDs so only truly newly inserted rows get row-flash
  const initialIdsRef = useRef(null);
  if (initialIdsRef.current === null && transactions.length > 0) {
    initialIdsRef.current = new Set(transactions.map((t) => t.id));
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedMethod !== 'all' && (t.paymentMethod || 'online').toLowerCase() !== selectedMethod) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        return desc.includes(q) || cat.includes(q);
      }
      return true;
    });
  }, [transactions, selectedType, selectedMethod, searchQuery]);

  // Group by day (sorted newest first)
  const groupedDays = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((t) => {
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
  }, [filteredTransactions]);

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
                  signed
                  tone="auto"
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

                const isMenuOpen = activeMenuId === transaction.id;

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

                    {/* Right: Amount + Overflow Menu */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <Money
                          amount={signedAmount}
                          signed
                          tone="auto"
                          className="text-[15px] font-medium"
                        />
                      </div>

                      {/* Row Action Menu (…) */}
                      <div className="relative" data-menu-container>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : transaction.id)
                          }
                          aria-label="Transaction actions menu"
                          className="w-11 h-11 flex items-center justify-center rounded-[6px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 opacity-100 cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 top-full mt-1 w-36 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] py-1 z-30"
                            role="menu"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onDelete) onDelete(transaction);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-[var(--debit)] hover:bg-[var(--sunken)] flex items-center gap-2 cursor-pointer"
                              role="menuitem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
