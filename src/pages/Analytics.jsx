import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Money from '../components/Money';

const NOTE_COLORS = [
  '#7D8A82', // Stone (₹500)
  '#D9A21B', // Saffron (₹200)
  '#1F8FA8', // Lagoon (₹50)
  '#8A7FC4', // Lavender (₹100)
  '#8A9A2B', // Olive (₹20)
  '#8B5E3C', // Cocoa (₹10)
];
const COLOR_OTHER = '#5F6978';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] rounded-[14px] shadow-[var(--shadow-pop)] py-2 px-3 text-xs">
        <div className="text-[var(--ink-3)] mb-1">{label}</div>
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color || p.fill || 'var(--accent)' }}
            />
            <span className="text-[var(--ink-2)]">{p.name || 'Amount'}:</span>
            <Money amount={p.value} className="font-medium text-[var(--ink)]" />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function Analytics({ initialTransactions } = {}) {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState(() => initialTransactions || []);
  const [loading, setLoading] = useState(!initialTransactions);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    if (initialTransactions) {
      setTransactions(initialTransactions);
      setLoading(false);
    }
  }, [initialTransactions]);

  useEffect(() => {
    if (!currentUser || initialTransactions) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, initialTransactions]);

  // Available months (sorted chronological)
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (t.date) {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.add(key);
          }
        }
      });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions for selected period
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Period label
  const periodLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'all time';
    const [y, m] = selectedMonth.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, 1);
    return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Category breakdown (sorted horizontal list)
  const { categoryList, totalExpenses, topCategoryTitle } = useMemo(() => {
    const map = {};
    let total = 0;
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Other';
        const amt = Number(t.amount) || 0;
        map[cat] = (map[cat] || 0) + amt;
        total += amt;
      });

    const sorted = Object.entries(map)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    let title = 'No expenses in this period';
    if (sorted.length > 0 && total > 0) {
      const top = sorted[0];
      const pct = Math.round(top.percent);
      title = `${top.name} is ${pct}% of what you spent in ${periodLabel}`;
    }

    return {
      categoryList: sorted,
      totalExpenses: total,
      topCategoryTitle: title,
    };
  }, [filteredTransactions, periodLabel]);

  // Daily average finding
  const { dailyAverageTitle } = useMemo(() => {
    const dayMap = {};
    const expenseList = filteredTransactions.filter((t) => t.type === 'expense');

    expenseList.forEach((t) => {
      const d = t.date ? t.date.split('T')[0] : 'undated';
      dayMap[d] = (dayMap[d] || 0) + (Number(t.amount) || 0);
    });

    const activeDaysCount = Object.keys(dayMap).length;
    const avg = activeDaysCount > 0 ? Math.round(totalExpenses / activeDaysCount) : 0;

    const title =
      avg > 0
        ? `You spend about ₹${avg.toLocaleString('en-IN')} a day on average`
        : 'Spending timeline';

    return {
      dailyAverageTitle: title,
    };
  }, [filteredTransactions, totalExpenses]);

  // Wallet Comparison: Online vs Cash in selected period
  const { walletTitle, walletBarData } = useMemo(() => {
    let online = 0;
    let cash = 0;
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const isCash = (t.paymentMethod || '').toLowerCase() === 'cash';
        const amt = Number(t.amount) || 0;
        if (isCash) cash += amt;
        else online += amt;
      });

    const total = online + cash;
    const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;

    let title = 'Online and Cash wallet distribution';
    if (total > 0) {
      title = `Online spending accounts for ${onlinePct}% of expenses`;
    }

    return {
      walletTitle: title,
      walletBarData: [
        { name: 'Online', amount: online, fill: 'var(--accent)' },
        { name: 'Cash', amount: cash, fill: 'var(--cat-saffron)' },
      ],
    };
  }, [filteredTransactions]);

  // 6-Month Trend Data
  const monthlyTrendData = useMemo(() => {
    const monthMap = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      monthMap[key] = { key, month: label, amount: 0 };
    }

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (t.date) {
          const key = t.date.slice(0, 7);
          if (monthMap[key]) {
            monthMap[key].amount += Number(t.amount) || 0;
          }
        }
      });

    return Object.values(monthMap);
  }, [transactions]);

  if (loading) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-8 bg-[var(--sunken)] rounded-[4px] w-64" />
        <div className="h-4 bg-[var(--sunken)] rounded-[4px] w-48" />
        <div className="h-64 bg-[var(--sunken)] rounded-[6px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* ── HEADER & MONTH FILTER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Analytics</h1>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Spending patterns and wallet breakdown
          </p>
        </div>

        {/* Month Selector: native select styled as .field */}
        <div className="flex items-center gap-2">
          <label htmlFor="analytics-month" className="text-xs text-[var(--ink-3)]">
            Period:
          </label>
          <select
            id="analytics-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="field h-9 px-3 text-xs w-44 bg-[var(--surface)] cursor-pointer"
          >
            <option value="all">All time</option>
            {availableMonths.map((m) => {
              const [y, mon] = m.split('-');
              const d = new Date(Number(y), Number(mon) - 1, 1);
              const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--ink-2)] max-w-sm mx-auto">
          No transactions yet to analyze. Add expenses from the Home tab to see insights.
        </div>
      ) : (
        <div className="space-y-12">
          {/* ── SECTION 1: CATEGORY BREAKDOWN (Sorted horizontal bar list, no pie) ── */}
          <section aria-label="Category breakdown" className="space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--ink)]">
                {topCategoryTitle}
              </h2>
              <p className="text-[13px] text-[var(--ink-3)] mt-0.5">
                Category spending in {periodLabel}
              </p>
            </div>

            {categoryList.length === 0 ? (
              <div className="py-6 text-xs text-[var(--ink-3)]">
                No expense records in this period.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {categoryList.map((cat, idx) => {
                  const color =
                    idx < NOTE_COLORS.length ? NOTE_COLORS[idx] : COLOR_OTHER;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--ink)] font-medium truncate max-w-[240px]">
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2 text-right">
                          <Money amount={cat.amount} className="font-medium text-[var(--ink)]" />
                          <span className="text-[var(--ink-3)] w-12 text-right">
                            {cat.percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Horizontal Bar */}
                      <div className="h-1.5 w-full bg-[var(--sunken)] rounded-[3px] overflow-hidden">
                        <div
                          className="h-full rounded-[3px] transition-all"
                          style={{
                            width: `${Math.min(100, Math.max(1, cat.percent))}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── SECTION 2: WALLET DISTRIBUTION (Cash vs Online Bar Chart) ── */}
          <section aria-label="Wallet breakdown" className="space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--ink)]">
                {walletTitle}
              </h2>
              <p className="text-[13px] text-[var(--ink-3)] mt-0.5">
                Online vs Cash in {periodLabel}
              </p>
            </div>

            <div className="w-full pt-2">
              <ResponsiveContainer width="100%" aspect={2.4}>
                <BarChart data={walletBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                    tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── SECTION 3: 6-MONTH TREND (Line chart, flat, no gridlines except baseline) ── */}
          <section aria-label="Spending trend" className="space-y-4">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--ink)]">
                {dailyAverageTitle}
              </h2>
              <p className="text-[13px] text-[var(--ink-3)] mt-0.5">
                Monthly outlay across the last 6 months
              </p>
            </div>

            <div className="w-full pt-2">
              <ResponsiveContainer width="100%" aspect={2.4}>
                <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                    tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--ink-3)', fontSize: 12 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Spent"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: 'var(--accent)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
