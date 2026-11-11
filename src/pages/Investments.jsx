import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  Plus,
  Trash2,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  addInvestment,
  deleteInvestment,
} from '../utils/investmentService';
import {
  addSalary,
  deleteSalary,
} from '../utils/salaryService';
import Money from '../components/Money';
import CustomSelect from '../components/CustomSelect';

const BANKNOTE_HUES = [
  'var(--cat-stone)',
  'var(--cat-saffron)',
  'var(--cat-lagoon)',
  'var(--cat-lavender)',
  'var(--cat-olive)',
  'var(--cat-cocoa)',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Investments({ initialHoldings, initialSalaryHistory } = {}) {
  const auth = useAuth?.() || {};
  const currentUser = auth.currentUser;
  const notification = useNotification?.() || {};
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});

  // Tab: 'investments' | 'salary'
  const [activeTab, setActiveTab] = useState('investments');

  // Investments State
  const [investments, setInvestments] = useState(() => initialHoldings || []);
  const [filterType, setFilterType] = useState('all');
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [selectedMobileHolding, setSelectedMobileHolding] = useState(null);

  // Salary State
  const [salaries, setSalaries] = useState(() => initialSalaryHistory || []);
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);

  // Forms
  const [investmentForm, setInvestmentForm] = useState({
    name: '',
    assetType: 'Mutual Funds',
    provider: '',
    investedAmount: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [salaryForm, setSalaryForm] = useState({
    salaryMonth: MONTH_NAMES[new Date().getMonth()],
    amount: '',
    receivedDate: new Date().toISOString().split('T')[0],
    companyOrSource: '',
    notes: '',
  });

  useEffect(() => {
    if (initialHoldings) {
      setInvestments(initialHoldings);
    }
  }, [initialHoldings]);

  useEffect(() => {
    if (initialSalaryHistory) {
      setSalaries(initialSalaryHistory);
    }
  }, [initialSalaryHistory]);

  // Firestore subscribers (if not using mock props)
  useEffect(() => {
    if (!currentUser || initialHoldings) return;
    const qInv = query(
      collection(db, 'investments'),
      where('userId', '==', currentUser.uid)
    );
    const unsubInv = onSnapshot(qInv, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInvestments(docs);
    });

    return () => unsubInv();
  }, [currentUser, initialHoldings]);

  useEffect(() => {
    if (!currentUser || initialSalaryHistory) return;
    const qSal = query(
      collection(db, 'salaries'),
      where('userId', '==', currentUser.uid)
    );
    const unsubSal = onSnapshot(qSal, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSalaries(docs);
    });

    return () => unsubSal();
  }, [currentUser, initialSalaryHistory]);

  // Portfolio calculations
  const { totalInvested, totalCurrentValue, netReturn, assetTypesPresent, typeBreakdown } =
    useMemo(() => {
      let invested = 0;
      let current = 0;
      const typeMap = {};

      investments.forEach((inv) => {
        const invAmt = Number(inv.investedAmount ?? inv.invested) || 0;
        const curAmt = Number(inv.currentValue ?? inv.current) || invAmt;
        const type = inv.assetType || inv.type || 'Other';

        invested += invAmt;
        current += curAmt;

        if (!typeMap[type]) {
          typeMap[type] = { type, invested: 0, current: 0 };
        }
        typeMap[type].invested += invAmt;
        typeMap[type].current += curAmt;
      });

      const ret = current - invested;
      const pct = invested > 0 ? (ret / invested) * 100 : 0;

      const typesList = Object.keys(typeMap);

      const breakdown = typesList.map((t) => ({
        type: t,
        value: typeMap[t].current,
        percent: current > 0 ? (typeMap[t].current / current) * 100 : 0,
      }));

      return {
        totalInvested: invested,
        totalCurrentValue: current,
        netReturn: ret,
        returnPercent: pct,
        assetTypesPresent: typesList,
        typeBreakdown: breakdown,
      };
    }, [investments]);

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    if (filterType === 'all') return investments;
    return investments.filter((inv) => {
      const t = (inv.assetType || inv.type || '').toLowerCase();
      return t === filterType.toLowerCase();
    });
  }, [investments, filterType]);

  // Handle add investment
  const handleAddInvestmentSubmit = async (e) => {
    e.preventDefault();
    const invAmt = parseFloat(investmentForm.investedAmount);
    const curAmt = parseFloat(investmentForm.currentValue || investmentForm.investedAmount);

    if (!investmentForm.name || isNaN(invAmt) || invAmt <= 0) {
      showError('Please enter a valid asset name and invested amount.');
      return;
    }

    try {
      if (currentUser) {
        await addInvestment(currentUser.uid, {
          name: investmentForm.name.trim(),
          assetType: investmentForm.assetType,
          provider: investmentForm.provider.trim(),
          investedAmount: invAmt,
          currentValue: curAmt,
          purchaseDate: investmentForm.purchaseDate,
          notes: investmentForm.notes.trim(),
        });
      } else {
        setInvestments((prev) => [
          ...prev,
          {
            id: `inv-${Date.now()}`,
            ...investmentForm,
            investedAmount: invAmt,
            currentValue: curAmt,
          },
        ]);
      }
      setShowAddInvestmentModal(false);
      setInvestmentForm({
        name: '',
        assetType: 'Mutual Funds',
        provider: '',
        investedAmount: '',
        currentValue: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      showSuccess('Investment saved.');
    } catch {
      showError('Failed to save investment.');
    }
  };

  // Handle delete investment
  const handleDeleteInvestment = async (invId) => {
    try {
      if (currentUser) {
        await deleteInvestment(invId);
      }
      setInvestments((prev) => prev.filter((i) => i.id !== invId));
      setSelectedMobileHolding(null);
      showSuccess('Investment deleted.');
    } catch {
      showError('Failed to delete investment.');
    }
  };

  // Handle add salary
  const handleAddSalarySubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(salaryForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showError('Please enter a valid salary amount.');
      return;
    }

    try {
      if (currentUser) {
        await addSalary(currentUser.uid, {
          salaryMonth: salaryForm.salaryMonth,
          amount: amt,
          receivedDate: salaryForm.receivedDate,
          companyOrSource: salaryForm.companyOrSource.trim() || 'Company',
          notes: salaryForm.notes.trim(),
        });
      } else {
        setSalaries((prev) => [
          ...prev,
          {
            id: `sal-${Date.now()}`,
            ...salaryForm,
            amount: amt,
            company: salaryForm.companyOrSource,
            date: salaryForm.receivedDate,
          },
        ]);
      }
      setShowAddSalaryModal(false);
      setSalaryForm({
        salaryMonth: MONTH_NAMES[new Date().getMonth()],
        amount: '',
        receivedDate: new Date().toISOString().split('T')[0],
        companyOrSource: '',
        notes: '',
      });
      showSuccess('Salary recorded.');
    } catch {
      showError('Failed to record salary.');
    }
  };

  // Handle delete salary
  const handleDeleteSalary = async (salId) => {
    try {
      if (currentUser) {
        await deleteSalary(salId);
      }
      setSalaries((prev) => prev.filter((s) => s.id !== salId));
      showSuccess('Salary entry deleted.');
    } catch {
      showError('Failed to delete salary entry.');
    }
  };

  // Chronological timeline grouping for salary (newest first, grouped by year)
  const salaryTimeline = useMemo(() => {
    // Sort newest first
    const sorted = [...salaries].sort((a, b) => {
      const dateA = new Date(a.receivedDate || a.date || 0).getTime();
      const dateB = new Date(b.receivedDate || b.date || 0).getTime();
      return dateB - dateA;
    });

    let totalReceived = 0;
    const itemsWithDelta = sorted.map((entry, index) => {
      const amt = Number(entry.amount) || 0;
      totalReceived += amt;

      // Delta compared to the chronologically prior entry (which is at index + 1 in a newest-first array)
      const nextOlder = sorted[index + 1];
      let delta = null;
      let deltaMonthName = '';
      if (nextOlder) {
        const olderAmt = Number(nextOlder.amount) || 0;
        delta = amt - olderAmt;
        const olderDate = new Date(nextOlder.receivedDate || nextOlder.date);
        deltaMonthName = !isNaN(olderDate.getTime())
          ? olderDate.toLocaleString('en-IN', { month: 'short' })
          : nextOlder.salaryMonth || '';
      }

      const d = new Date(entry.receivedDate || entry.date);
      const year = !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
      const monthLabel = !isNaN(d.getTime())
        ? d.toLocaleString('en-IN', { month: 'long' })
        : entry.salaryMonth || 'Month';

      return {
        ...entry,
        year,
        monthLabel,
        amountNum: amt,
        delta,
        deltaMonthName,
      };
    });

    // Group by year
    const yearGroups = {};
    itemsWithDelta.forEach((item) => {
      if (!yearGroups[item.year]) {
        yearGroups[item.year] = [];
      }
      yearGroups[item.year].push(item);
    });

    return {
      totalReceived,
      monthCount: sorted.length,
      years: Object.entries(yearGroups).sort(([yA], [yB]) => Number(yB) - Number(yA)),
    };
  }, [salaries]);

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* ── TOP HEADER / TAB SWITCH & ACTION BUTTON ── */}
      <div className="flex items-center justify-between border-b border-[var(--line)]">
        {/* Text tab pair: Investments / Salary with 2px accent underline */}
        <div className="flex gap-8" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'investments'}
            onClick={() => setActiveTab('investments')}
            className={`pb-3 text-base transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'investments'
                ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)] font-medium'
            }`}
          >
            Investments
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'salary'}
            onClick={() => setActiveTab('salary')}
            className={`pb-3 text-base transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'salary'
                ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)] font-medium'
            }`}
          >
            Salary
          </button>
        </div>

        {/* Dynamic primary action button */}
        <button
          type="button"
          onClick={() => {
            if (activeTab === 'investments') {
              setShowAddInvestmentModal(true);
            } else {
              setShowAddSalaryModal(true);
            }
          }}
          className="btn btn-primary h-9 px-4 text-xs -mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'investments' ? 'Add investment' : 'Log salary'}</span>
        </button>
      </div>

      {/* ── INVESTMENTS VIEW ── */}
      {activeTab === 'investments' && (
        <div className="space-y-8">
          {/* Portfolio Value Summary */}
          <section aria-label="Portfolio summary">
            <div className="text-xs text-[var(--ink-3)] font-normal mb-1">
              Portfolio value
            </div>
            <div className="text-[clamp(40px,8vw,64px)] font-light leading-none tracking-[-0.02em] tabular-nums text-[var(--ink)]">
              <Money amount={totalCurrentValue} tone="neutral" />
            </div>

            {/* Single line: Invested and Returns */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-[var(--ink-2)]">
                Invested <Money amount={totalInvested} className="font-medium text-[var(--ink)]" />
              </span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-[var(--ink-2)]">
                Returns{' '}
                {netReturn === 0 ? (
                  <span className="text-[var(--ink-3)] font-medium">
                    ₹0.00 <span className="font-normal opacity-80">(no change yet)</span>
                  </span>
                ) : (
                  <Money
                    amount={netReturn}
                    signed
                    tone={netReturn > 0 ? 'credit' : 'debit'}
                    className="font-medium"
                  />
                )}
              </span>
            </div>

            {/* Proportional Banknote Allocation Bar */}
            {typeBreakdown.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-medium text-[var(--ink-2)]">Allocation</div>
                {/* 10px stacked bar */}
                <div className="h-2.5 w-full rounded-[4px] bg-[var(--sunken)] overflow-hidden flex">
                  {typeBreakdown.map((item, idx) => (
                    <div
                      key={item.type}
                      className="h-full transition-all"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: BANKNOTE_HUES[idx % BANKNOTE_HUES.length],
                      }}
                      title={`${item.type}: ₹${item.value} (${Math.round(item.percent)}%)`}
                    />
                  ))}
                </div>

                {/* Labels under stacked bar */}
                <div className="flex flex-wrap gap-4 text-xs">
                  {typeBreakdown.map((item, idx) => (
                    <div key={item.type} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: BANKNOTE_HUES[idx % BANKNOTE_HUES.length] }}
                      />
                      <span className="text-[var(--ink-2)]">{item.type}</span>
                      <Money amount={item.value} className="text-[var(--ink)] font-medium" />
                      <span className="text-[var(--ink-3)] font-normal">
                        ({Math.round(item.percent)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Holdings Section */}
          <section aria-label="Holdings" className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
              <h3 className="text-[17px] font-semibold text-[var(--ink)]">Holdings</h3>

              {/* Dynamic Type Filter: <select> on mobile, text tab strip on desktop */}
              <div>
                {/* Desktop Tab Strip */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-[var(--sunken)] text-[var(--ink)] font-medium'
                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    All
                  </button>
                  {assetTypesPresent.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors cursor-pointer ${
                        filterType.toLowerCase() === t.toLowerCase()
                          ? 'bg-[var(--sunken)] text-[var(--ink)] font-medium'
                          : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Mobile Custom Select */}
                <div className="sm:hidden">
                  <CustomSelect
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-8 px-2 text-xs w-32"
                    aria-label="Filter asset types"
                  >
                    <option value="all">All</option>
                    {assetTypesPresent.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </CustomSelect>
                </div>
              </div>
            </div>

            {/* Desktop Holdings Table (>=768px): sticky header, right-aligned numbers */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-14 bg-[var(--bg)] border-b border-[var(--line)] text-xs text-[var(--ink-3)] font-normal z-10">
                  <tr>
                    <th className="py-2.5 pr-4 font-normal">Name</th>
                    <th className="py-2.5 px-4 font-normal">Type</th>
                    <th className="py-2.5 px-4 text-right font-normal">Invested</th>
                    <th className="py-2.5 px-4 text-right font-normal">Current value</th>
                    <th className="py-2.5 px-4 text-right font-normal">Return</th>
                    <th className="py-2.5 pl-4 text-right font-normal w-12" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredInvestments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-[var(--ink-2)]">
                        No investments yet. Add one, or tell your AI agent: Log a ₹15,000 SIP in a flexi cap fund.
                      </td>
                    </tr>
                  ) : (
                    filteredInvestments.map((inv) => {
                      const invAmt = Number(inv.investedAmount ?? inv.invested) || 0;
                      const curAmt = Number(inv.currentValue ?? inv.current) || invAmt;
                      const diff = curAmt - invAmt;
                      const pct = invAmt > 0 ? (diff / invAmt) * 100 : 0;
                      const assetType = inv.assetType || inv.type || 'Other';

                      return (
                        <tr key={inv.id} className="hover:bg-[var(--sunken)]/40 transition-colors group">
                          <td className="py-3.5 pr-4">
                            <div className="font-medium text-[var(--ink)] leading-snug">
                              {inv.name || 'Holding'}
                            </div>
                            {inv.provider && (
                              <div className="text-xs text-[var(--ink-3)] mt-0.5">
                                {inv.provider}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[var(--ink-2)]">
                            {assetType}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Money amount={invAmt} className="font-medium text-[var(--ink-2)]" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Money amount={curAmt} className="font-medium text-[var(--ink)]" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {diff === 0 ? (
                              <span className="text-xs text-[var(--ink-3)] font-normal">
                                0.0%
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  diff > 0 ? 'text-[var(--credit)]' : 'text-[var(--debit)]'
                                }`}
                              >
                                {diff > 0 ? '+' : '−'}
                                {Math.abs(pct).toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-1.5 rounded-[6px] text-[var(--ink-3)] hover:text-[var(--debit)] hover:bg-[var(--sunken)] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                              aria-label="Delete holding"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Holdings Stacked Cards (<768px): two-line row, tap opens sheet */}
            <div className="md:hidden divide-y divide-[var(--line)]">
              {filteredInvestments.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--ink-2)]">
                  No investments yet. Add one, or tell your AI agent: Log a ₹15,000 SIP in a flexi cap fund.
                </div>
              ) : (
                filteredInvestments.map((inv) => {
                  const invAmt = Number(inv.investedAmount ?? inv.invested) || 0;
                  const curAmt = Number(inv.currentValue ?? inv.current) || invAmt;
                  const diff = curAmt - invAmt;
                  const pct = invAmt > 0 ? (diff / invAmt) * 100 : 0;
                  const assetType = inv.assetType || inv.type || 'Other';

                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => setSelectedMobileHolding(inv)}
                      className="w-full py-3 flex flex-col gap-1 text-left active:bg-[var(--sunken)] transition-colors cursor-pointer"
                    >
                      {/* Line 1: Name left, current value right */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--ink)] truncate max-w-[200px]">
                          {inv.name}
                        </span>
                        <Money amount={curAmt} className="font-medium text-[var(--ink)]" />
                      </div>

                      {/* Line 2: Type and provider left, return right */}
                      <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
                        <span className="truncate max-w-[200px]">
                          {assetType}
                          {inv.provider ? ` · ${inv.provider}` : ''}
                        </span>
                        {diff === 0 ? (
                          <span className="text-[var(--ink-3)]">0.0%</span>
                        ) : (
                          <span
                            className={`font-medium tabular-nums ${
                              diff > 0 ? 'text-[var(--credit)]' : 'text-[var(--debit)]'
                            }`}
                          >
                            {diff > 0 ? '+' : '−'}
                            {Math.abs(pct).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── SALARY TIMELINE VIEW ── */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Summary Line: "Received ₹X across N months." */}
          <div className="text-xs text-[var(--ink-3)] font-normal border-b border-[var(--line)] pb-3">
            Received{' '}
            <Money
              amount={salaryTimeline.totalReceived}
              className="font-medium text-[var(--ink)]"
            />{' '}
            across {salaryTimeline.monthCount} {salaryTimeline.monthCount === 1 ? 'month' : 'months'}.
          </div>

          {/* Timeline */}
          <div className="relative pl-6 space-y-6 border-l border-[var(--line)] ml-2 min-h-[80px]">
            {salaries.length === 0 ? (
              <div className="py-8 text-sm text-[var(--ink-2)]">
                No salary entries yet. Add your first salary record to start your timeline.
              </div>
            ) : (
              /* Genuine Timeline: 1px vertical line with 7px dots */
              <div className="space-y-8">
                {salaryTimeline.years.map(([year, entries]) => (
                  <div key={year} className="space-y-4">
                    <div className="text-xs font-semibold text-[var(--ink-3)] sticky top-14 bg-[var(--bg)] py-1 z-10">
                      {year}
                    </div>

                    <div className="space-y-6">
                      {entries.map((entry) => (
                        <div key={entry.id} className="relative group">
                          {/* 7px dot */}
                          <div className="absolute -left-[28px] top-1.5 w-[7px] h-[7px] rounded-full bg-[var(--ink-3)] ring-4 ring-[var(--bg)]" />

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium text-[var(--ink)]">
                                {entry.monthLabel}
                              </div>
                              <div className="text-xs text-[var(--ink-3)] mt-0.5">
                                {entry.companyOrSource || entry.company || 'Source'}
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-3">
                              <div>
                                <Money
                                  amount={entry.amountNum}
                                  className="text-sm font-medium text-[var(--ink)]"
                                />
                                {entry.delta !== null && (
                                  <div className="text-xs text-[var(--ink-3)] mt-0.5 tabular-nums">
                                    {entry.delta === 0 ? (
                                      <span>Same as {entry.deltaMonthName}</span>
                                    ) : (
                                      <span>
                                        {entry.delta > 0 ? '+' : '−'}
                                        <Money
                                          amount={Math.abs(entry.delta)}
                                          className="text-xs text-[var(--ink-3)] font-normal"
                                        />{' '}
                                        from {entry.deltaMonthName}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteSalary(entry.id)}
                                className="p-1 rounded-[6px] text-[var(--ink-3)] hover:text-[var(--debit)] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                                aria-label="Delete salary entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE HOLDING DETAIL BOTTOM SHEET ── */}
      {selectedMobileHolding && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Holding details"
        >
          <div className="w-full bg-[var(--surface)] border-t border-[var(--line)] rounded-t-[14px] p-5 space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-base font-semibold text-[var(--ink)]">
                {selectedMobileHolding.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMobileHolding(null)}
                className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-3)]">Asset type</span>
                <span className="font-medium text-[var(--ink)]">
                  {selectedMobileHolding.assetType || selectedMobileHolding.type || 'Other'}
                </span>
              </div>

              {selectedMobileHolding.provider && (
                <div className="flex justify-between py-1 border-b border-[var(--line)]">
                  <span className="text-[var(--ink-3)]">Provider / Platform</span>
                  <span className="font-medium text-[var(--ink)]">
                    {selectedMobileHolding.provider}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-3)]">Invested amount</span>
                <Money
                  amount={Number(selectedMobileHolding.investedAmount ?? selectedMobileHolding.invested) || 0}
                  className="font-medium text-[var(--ink)]"
                />
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-3)]">Current value</span>
                <Money
                  amount={Number(selectedMobileHolding.currentValue ?? selectedMobileHolding.current) || 0}
                  className="font-medium text-[var(--ink)]"
                />
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--line)]">
                <span className="text-[var(--ink-3)]">Total return</span>
                {(() => {
                  const inv = Number(selectedMobileHolding.investedAmount ?? selectedMobileHolding.invested) || 0;
                  const cur = Number(selectedMobileHolding.currentValue ?? selectedMobileHolding.current) || inv;
                  const diff = cur - inv;
                  const pct = inv > 0 ? (diff / inv) * 100 : 0;
                  if (diff === 0) {
                    return <span className="text-[var(--ink-3)]">0.0% (no change yet)</span>;
                  }
                  return (
                    <span
                      className={`font-medium ${
                        diff > 0 ? 'text-[var(--credit)]' : 'text-[var(--debit)]'
                      }`}
                    >
                      {diff > 0 ? '+' : '−'}₹{Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({Math.abs(pct).toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Always-reachable Delete Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleDeleteInvestment(selectedMobileHolding.id)}
                className="btn btn-danger w-full text-xs h-10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete holding</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD INVESTMENT MODAL ── */}
      {showAddInvestmentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Add investment"
        >
          <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[14px] shadow-[var(--shadow-pop)] p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-base font-semibold text-[var(--ink)]">Add investment</h3>
              <button
                type="button"
                onClick={() => setShowAddInvestmentModal(false)}
                className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInvestmentSubmit} className="space-y-4">
              <div>
                <label className="field-label">Asset name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap"
                  value={investmentForm.name}
                  onChange={(e) =>
                    setInvestmentForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="field h-10 text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Type</label>
                  <CustomSelect
                    value={investmentForm.assetType}
                    onChange={(e) =>
                      setInvestmentForm((p) => ({ ...p, assetType: e.target.value }))
                    }
                    className="h-10 text-xs w-full"
                  >
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Fixed Deposits">Fixed Deposits</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Stocks">Stocks / Equity</option>
                    <option value="Other">Other</option>
                  </CustomSelect>
                </div>

                <div>
                  <label className="field-label">Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha, PhonePe"
                    value={investmentForm.provider}
                    onChange={(e) =>
                      setInvestmentForm((p) => ({ ...p, provider: e.target.value }))
                    }
                    className="field h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Invested amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={investmentForm.investedAmount}
                    onChange={(e) =>
                      setInvestmentForm((p) => ({ ...p, investedAmount: e.target.value }))
                    }
                    className="field h-10 text-sm tabular-nums"
                  />
                </div>

                <div>
                  <label className="field-label">Current value (₹)</label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="Same as invested"
                    value={investmentForm.currentValue}
                    onChange={(e) =>
                      setInvestmentForm((p) => ({ ...p, currentValue: e.target.value }))
                    }
                    className="field h-10 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvestmentModal(false)}
                  className="btn btn-quiet flex-1 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 text-xs">
                  Save investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD SALARY MODAL ── */}
      {showAddSalaryModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Log salary"
        >
          <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[14px] shadow-[var(--shadow-pop)] p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-base font-semibold text-[var(--ink)]">Log salary</h3>
              <button
                type="button"
                onClick={() => setShowAddSalaryModal(false)}
                className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSalarySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Salary month</label>
                  <CustomSelect
                    value={salaryForm.salaryMonth}
                    onChange={(e) =>
                      setSalaryForm((p) => ({ ...p, salaryMonth: e.target.value }))
                    }
                    className="h-10 text-xs w-full"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="field-label">Received date</label>
                  <input
                    type="date"
                    value={salaryForm.receivedDate}
                    onChange={(e) =>
                      setSalaryForm((p) => ({ ...p, receivedDate: e.target.value }))
                    }
                    className="field h-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Net amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={salaryForm.amount}
                  onChange={(e) =>
                    setSalaryForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="field h-10 text-sm tabular-nums"
                  autoFocus
                />
              </div>

              <div>
                <label className="field-label">Company / Source</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={salaryForm.companyOrSource}
                  onChange={(e) =>
                    setSalaryForm((p) => ({ ...p, companyOrSource: e.target.value }))
                  }
                  className="field h-10 text-sm"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSalaryModal(false)}
                  className="btn btn-quiet flex-1 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 text-xs">
                  Save salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
