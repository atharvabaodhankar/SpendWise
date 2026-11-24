import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { ChevronRight, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import BudgetGoals from '../components/BudgetGoals';
import RecurringTransactions from '../components/RecurringTransactions';
import BalanceManager from '../components/BalanceManager';
import InitialBalanceSetup from '../components/InitialBalanceSetup';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Money from '../components/Money';
import { checkBalanceAlert, checkDailyExpenseAlert } from '../utils/emailAlerts';
import {
  getLocalDateString,
  getLocalTodayString,
  getCurrentMonthString,
  sortTransactionsChronological,
} from '../utils/dateUtils';

const BANKNOTE_HUES = [
  'var(--cat-stone)',
  'var(--cat-saffron)',
  'var(--cat-lagoon)',
  'var(--cat-lavender)',
  'var(--cat-olive)',
  'var(--cat-cocoa)',
];

const HERO_METRIC_STORAGE_KEY = 'spendwise_hero_metric_preference';

export default function Dashboard({ initialBalances, initialDebts, initialPreferences, initialHeroMetric } = {}) {
  const auth = useAuth?.() || {};
  const currentUser = auth.currentUser;
  const notification = useNotification?.() || {};
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  const outletContext = useOutletContext();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(!initialBalances && !initialDebts);
  const [currentBalances, setCurrentBalances] = useState(() => {
    if (!initialBalances) return null;
    return {
      online: initialBalances.online ?? initialBalances.bank ?? 0,
      cash: initialBalances.cash ?? 0,
    };
  });
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [showBalanceManager, setShowBalanceManager] = useState(false);
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [debts, setDebts] = useState(() => ({
    youOwe: initialDebts?.owed ?? initialDebts?.youOwe ?? 0,
    owedToYou: initialDebts?.lent ?? initialDebts?.owedToYou ?? 0,
  }));
  const [isRecurringExpanded, setIsRecurringExpanded] = useState(false);

  const [heroMetric, setHeroMetric] = useState(() => {
    if (initialHeroMetric) return initialHeroMetric;
    try {
      const saved = localStorage.getItem(HERO_METRIC_STORAGE_KEY);
      if (saved === 'month' || saved === 'today' || saved === 'net') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'month';
  });

  const [showBalancesPreference, setShowBalancesPreference] = useState(() => {
    if (initialPreferences?.showBalances !== undefined) {
      return Boolean(initialPreferences.showBalances);
    }
    return true;
  });

  const handleMetricChange = (metric) => {
    setHeroMetric(metric);
    try {
      localStorage.setItem(HERO_METRIC_STORAGE_KEY, metric);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (initialHeroMetric && (initialHeroMetric === 'month' || initialHeroMetric === 'today' || initialHeroMetric === 'net')) {
      setHeroMetric(initialHeroMetric);
    }
  }, [initialHeroMetric]);

  useEffect(() => {
    if (initialPreferences?.showBalances !== undefined) {
      setShowBalancesPreference(Boolean(initialPreferences.showBalances));
    }
  }, [initialPreferences]);

  useEffect(() => {
    if (initialBalances) {
      setCurrentBalances({
        online: initialBalances.online ?? initialBalances.bank ?? 0,
        cash: initialBalances.cash ?? 0,
      });
    }
  }, [initialBalances]);

  useEffect(() => {
    if (initialDebts) {
      setDebts({
        youOwe: initialDebts.owed ?? initialDebts.youOwe ?? 0,
        owedToYou: initialDebts.lent ?? initialDebts.owedToYou ?? 0,
      });
    }
  }, [initialDebts]);

  const isFormOpen = showLocalForm || Boolean(outletContext?.isAddExpenseOpen);
  const handleOpenForm = () => {
    setShowLocalForm(true);
    outletContext?.openAddExpense?.();
  };
  const handleCloseForm = () => {
    setShowLocalForm(false);
    outletContext?.closeAddExpense?.();
  };

  useEffect(() => {
    if (!currentUser) return;

    // Transactions listener with sort and graceful fallback
    const sortTransactionsList = (list) => sortTransactionsChronological(list);

    let unsubscribeTransactions = () => {};
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (qs) => {
        const data = [];
        qs.forEach((d) => data.push({ id: d.id, ...d.data() }));
        setTransactions(sortTransactionsList(data));
        setLoading(false);
      },
      (error) => {
        console.warn('Composite index query failed, using fallback query:', error);
        const fallbackQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid)
        );
        unsubscribeTransactions = onSnapshot(fallbackQuery, (qs) => {
          const data = [];
          qs.forEach((d) => data.push({ id: d.id, ...d.data() }));
          setTransactions(sortTransactionsList(data));
          setLoading(false);
        });
      }
    );

    let unsubscribeBalances = () => {};
    if (!initialBalances) {
      const balanceDoc = doc(db, 'currentBalances', currentUser.uid);
      unsubscribeBalances = onSnapshot(balanceDoc, (ds) => {
        if (ds.exists()) {
          setCurrentBalances(ds.data());
          setShowInitialSetup(false);
        } else {
          setCurrentBalances(null);
          setShowInitialSetup(true);
        }
      });
    }

    let unsubDebtor = () => {};
    let unsubCreditor = () => {};
    if (!initialDebts) {
      const qDebtor = query(
        collection(db, 'debts'),
        where('debtorId', '==', currentUser.uid),
        where('status', 'in', ['unpaid', 'pending_confirmation'])
      );
      const qCreditor = query(
        collection(db, 'debts'),
        where('creditorId', '==', currentUser.uid),
        where('status', 'in', ['unpaid', 'pending_confirmation'])
      );

      unsubDebtor = onSnapshot(qDebtor, (snap) => {
        const oweTotal = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
        setDebts((prev) => ({ ...prev, youOwe: oweTotal }));
      });

      unsubCreditor = onSnapshot(qCreditor, (snap) => {
        const owedTotal = snap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);
        setDebts((prev) => ({ ...prev, owedToYou: owedTotal }));
      });
    }

    let unsubscribeUser = () => {};
    const userDocRef = doc(db, 'users', currentUser.uid);
    unsubscribeUser = onSnapshot(
      userDocRef,
      (ds) => {
        if (ds && typeof ds.exists === 'function' && ds.exists()) {
          const userData = ds.data();
          if (userData?.preferences?.showBalances !== undefined) {
            setShowBalancesPreference(Boolean(userData.preferences.showBalances));
          }
        }
      },
      () => {}
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBalances();
      unsubscribeUser();
      unsubDebtor();
      unsubCreditor();
    };
  }, [currentUser, initialBalances, initialDebts]);

  // Add transaction handler
  const addTransaction = async (transactionData) => {
    try {
      let transactionToSave = { ...transactionData };
      let amountToDeduct = parseFloat(transactionData.amount);

      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
        const totalAmount = parseFloat(transactionData.amount);
        const splitCount = transactionData.splitDetails.length + 1;
        transactionToSave.amount = parseFloat((totalAmount / splitCount).toFixed(2));
        transactionToSave.totalPaid = totalAmount;
      } else {
        transactionToSave.amount = parseFloat(transactionData.amount);
      }

      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionToSave,
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      if (transactionData.affectCurrentBalance && currentBalances) {
        const updatedBalances = {
          ...currentBalances,
          [transactionData.paymentMethod]:
            (currentBalances[transactionData.paymentMethod] || 0) -
            (transactionData.type === 'income' ? -amountToDeduct : amountToDeduct),
          lastUpdated: new Date(),
          updatedBy: 'transaction_add',
        };
        await setDoc(doc(db, 'currentBalances', currentUser.uid), updatedBalances);
        await checkBalanceAlert(currentUser.email, updatedBalances, currentBalances);
      }

      const todayExpenses =
        transactions
          .filter((t) => t.type === 'expense' && getLocalDateString(t.date) === todayStr)
          .reduce((sum, t) => sum + t.amount, 0) +
        (transactionData.type === 'expense' ? transactionToSave.amount : 0);
      await checkDailyExpenseAlert(currentUser.email, todayExpenses);

      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
        const splitPromises = transactionData.splitDetails.map(async (friend) => {
          const friendAmount =
            transactionData.splitMode === 'custom'
              ? friend.customAmount
              : transactionData.amount / (transactionData.splitDetails.length + 1);

          const debtRef = await addDoc(collection(db, 'debts'), {
            debtorId: friend.friendId,
            creditorId: currentUser.uid,
            amount: parseFloat(friendAmount),
            description: transactionData.description || transactionData.category,
            transactionId: docRef.id,
            status: 'unpaid',
            createdAt: new Date(),
          });

          await addDoc(collection(db, 'transactions'), {
            userId: friend.friendId,
            amount: parseFloat(friendAmount),
            type: 'expense',
            category: transactionData.category,
            description: `${transactionData.description || transactionData.category} (Split by ${
              currentUser.displayName || 'Friend'
            })`,
            date: transactionData.date,
            paymentMethod: 'owed',
            isSplit: true,
            paidBy: currentUser.uid,
            createdAt: new Date(),
            affectCurrentBalance: false,
          });

          const settleToken = btoa(
            `${debtRef.id}:${import.meta.env.VITE_SETTLE_SECRET || 'spendwise'}`
          )
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          await fetch('/api/send-email-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'bill_split',
              userEmail: friend.email,
              data: {
                senderName: currentUser.displayName || currentUser.email,
                amount: parseFloat(friendAmount).toFixed(2),
                description: transactionData.description || transactionData.category,
                debtId: debtRef.id,
                settleToken,
              },
            }),
          });
        });

        Promise.all(splitPromises)
          .then(() =>
            showSuccess(
              `Expense saved and ${transactionData.splitDetails.length} friend(s) notified.`
            )
          )
          .catch((err) => console.error(err));
      } else {
        showSuccess(
          transactionData.type === 'income' ? 'Income saved.' : 'Expense saved.'
        );
      }
      handleCloseForm();
    } catch (err) {
      console.error(err);
      showError('Failed to save transaction. Try again.');
    }
  };

  const handleDeleteRequest = (t) => setDeleteConfirmation(t);
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      // Reconcile balance if transaction affected current balance
      if (deleteConfirmation.affectCurrentBalance !== false && currentUser) {
        const amt = Number(deleteConfirmation.amount) || 0;
        const pm = (deleteConfirmation.paymentMethod || '').toLowerCase() === 'cash' ? 'cash' : 'online';
        // Reversal: If expense, refund back (+amt); if income, subtract (-amt)
        const reversalDelta = deleteConfirmation.type === 'expense' ? amt : -amt;
        const balanceRef = doc(db, 'currentBalances', currentUser.uid);
        const bSnap = await getDoc(balanceRef);
        if (bSnap.exists()) {
          const cur = bSnap.data();
          await setDoc(
            balanceRef,
            {
              ...cur,
              [pm]: (Number(cur[pm]) || 0) + reversalDelta,
              lastUpdated: new Date(),
              updatedBy: 'dashboard_delete',
            },
            { merge: true }
          );
        }
      }

      await deleteDoc(doc(db, 'transactions', deleteConfirmation.id));
      setDeleteConfirmation(null);
      showSuccess('Transaction deleted.');
    } catch {
      showError('Failed to delete transaction.');
    }
  };

  // Wallet figures
  const onlineBalance = currentBalances?.online ?? 0;
  const cashBalance = currentBalances?.cash ?? 0;
  const netBalance = onlineBalance + cashBalance;

  // Calculate local date strings
  const { todayStr, currentMonthStr } = useMemo(() => {
    return {
      todayStr: getLocalTodayString(),
      currentMonthStr: getCurrentMonthString(),
    };
  }, []);

  const spentThisMonth = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          (t.type || '').toLowerCase() === 'expense' &&
          getLocalDateString(t.date).startsWith(currentMonthStr)
      )
      .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
  }, [transactions, currentMonthStr]);

  const spentToday = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          (t.type || '').toLowerCase() === 'expense' &&
          getLocalDateString(t.date) === todayStr
      )
      .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
  }, [transactions, todayStr]);

  const heroAmount = useMemo(() => {
    if (heroMetric === 'today') return spentToday;
    if (heroMetric === 'net') return netBalance;
    return spentThisMonth;
  }, [heroMetric, spentToday, netBalance, spentThisMonth]);

  // Proportional bar calculation
  const onlinePositive = Math.max(0, onlineBalance);
  const cashPositive = Math.max(0, cashBalance);
  const positiveSum = onlinePositive + cashPositive;
  const onlinePercent = positiveSum > 0 ? (onlinePositive / positiveSum) * 100 : 50;
  const cashPercent = positiveSum > 0 ? (cashPositive / positiveSum) * 100 : 50;

  // Category breakdown for current month (Top 5)
  const topCategories = useMemo(() => {
    const map = {};
    let totalSpent = 0;
    transactions
      .filter(
        (t) =>
          (t.type || '').toLowerCase() === 'expense' &&
          getLocalDateString(t.date).startsWith(currentMonthStr)
      )
      .forEach((t) => {
        const cat = t.category || 'Other';
        const amt = Number(t.amount) || 0;
        map[cat] = (map[cat] || 0) + amt;
        totalSpent += amt;
      });

    const sorted = Object.entries(map)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      items: sorted.slice(0, 5),
      totalSpent,
    };
  }, [transactions, currentMonthStr]);

  if (loading) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-[var(--sunken)] rounded-[4px] w-48" />
        <div className="h-16 bg-[var(--sunken)] rounded-[6px] w-72" />
        <div className="h-2 bg-[var(--sunken)] rounded-[4px] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ── BALANCE / SPENDING HERO BLOCK ── */}
        <section aria-label="Wallet balances and spending">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {/* Hero Metric Selector (Quiet segmented toggle) */}
              <div
                aria-label="Select hero metric"
                className="flex items-center gap-1 mb-2.5 bg-[var(--sunken)] p-0.5 rounded-[6px] w-fit"
              >
                <button
                  type="button"
                  aria-pressed={heroMetric === 'month'}
                  onClick={() => handleMetricChange('month')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                    heroMetric === 'month'
                      ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  Spent this month
                </button>
                <button
                  type="button"
                  aria-pressed={heroMetric === 'today'}
                  onClick={() => handleMetricChange('today')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                    heroMetric === 'today'
                      ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  Spent today
                </button>
                <button
                  type="button"
                  aria-pressed={heroMetric === 'net'}
                  onClick={() => handleMetricChange('net')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                    heroMetric === 'net'
                      ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                  }`}
                >
                  Net balance
                </button>
              </div>

              <div className="text-[clamp(40px,8vw,64px)] font-light leading-none tracking-[-0.02em] tabular-nums text-[var(--ink)]">
                <Money amount={heroAmount} tone="neutral" />
              </div>
            </div>

            {/* Desktop Add Expense Button */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenForm}
                className="btn btn-primary h-10 px-4 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add expense</span>
              </button>
            </div>
          </div>

          {/* Proportional Online vs Cash Bar (Only visible when viewing Net balance AND showBalances preference is true) */}
          {heroMetric === 'net' && showBalancesPreference && (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => setShowBalanceManager(true)}
                className="w-full text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[4px] cursor-pointer"
                aria-label="Edit balances"
              >
                {/* 8px Proportional Bar */}
                <div className="h-2 w-full rounded-[4px] bg-[var(--sunken)] overflow-hidden flex">
                  {positiveSum > 0 ? (
                    <>
                      <div
                        className="h-full bg-[var(--accent)] transition-all"
                        style={{ width: `${onlinePercent}%` }}
                        title={`Online: ₹${onlinePositive}`}
                      />
                      <div
                        className="h-full bg-[var(--cat-saffron)] transition-all"
                        style={{ width: `${cashPercent}%` }}
                        title={`Cash: ₹${cashPositive}`}
                      />
                    </>
                  ) : (
                    <div className="h-full w-full bg-[var(--sunken)]" />
                  )}
                </div>

                {/* Labels under each end */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-[var(--ink-2)]">Online</span>
                    <Money
                      amount={onlineBalance}
                      type={onlineBalance < 0 ? 'debit' : 'neutral'}
                      className="font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--cat-saffron)]" />
                    <span className="text-[var(--ink-2)]">Cash</span>
                    <Money
                      amount={cashBalance}
                      type={cashBalance < 0 ? 'debit' : 'neutral'}
                      className="font-medium"
                    />
                    <span className="text-xs text-[var(--ink-3)] group-hover:text-[var(--ink)] ml-2">
                      Edit balances
                    </span>
                  </div>
                </div>
              </button>

              {/* Negative Cash Warning */}
              {cashBalance < 0 && (
                <div className="text-xs text-[var(--debit)] pt-1 flex items-center gap-2">
                  <span>Cash is below zero. Check your entries.</span>
                  <button
                    type="button"
                    onClick={() => setShowBalanceManager(true)}
                    className="underline hover:opacity-80 cursor-pointer"
                  >
                    Adjust balance
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 2-COLUMN DESKTOP (8/4 split, 48px gap) / 1-COLUMN MOBILE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── LEFT COLUMN (8 cols): LEDGER ── */}
          <div className="lg:col-span-8 space-y-6">
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteRequest}
              onOpenAddExpense={handleOpenForm}
              onOpenAgentConnect={() => outletContext?.openSettings?.('api')}
            />
          </div>

          {/* ── RIGHT COLUMN (4 cols): BUDGET, DEBTS, CATEGORIES, RECURRING ── */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Budget */}
            <section aria-label="Monthly budget" className="border-b border-[var(--line)] pb-6">
              <h3 className="text-[17px] font-semibold text-[var(--ink)] mb-3">
                Budget
              </h3>
              <BudgetGoals />
            </section>

            {/* Debts Block (Owed to you / You owe) - Hidden if both zero */}
            {(debts.owedToYou > 0 || debts.youOwe > 0) && (
              <section aria-label="Debts" className="border-b border-[var(--line)] pb-6 space-y-3">
                <h3 className="text-[17px] font-semibold text-[var(--ink)]">
                  Debts
                </h3>
                <div className="divide-y divide-[var(--line)] text-xs">
                  <button
                    type="button"
                    onClick={() => outletContext?.openFriends?.()}
                    className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[var(--sunken)]/40 transition-colors rounded-[4px] px-1 cursor-pointer"
                  >
                    <span className="text-[var(--ink-2)]">Owed to you</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Money amount={debts.owedToYou} type="credit" />
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => outletContext?.openFriends?.()}
                    className="w-full py-2.5 flex items-center justify-between text-left hover:bg-[var(--sunken)]/40 transition-colors rounded-[4px] px-1 cursor-pointer"
                  >
                    <span className="text-[var(--ink-2)]">You owe</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Money amount={debts.youOwe} type="debit" />
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                    </div>
                  </button>
                </div>
              </section>
            )}

            {/* Top 5 Categories This Month (The only chart on the dashboard) */}
            {topCategories.items.length > 0 && (
              <section aria-label="Top spending categories" className="border-b border-[var(--line)] pb-6 space-y-3">
                <h3 className="text-[17px] font-semibold text-[var(--ink)]">
                  This month, by category
                </h3>
                <div className="space-y-3">
                  {topCategories.items.map((cat, idx) => {
                    const color = BANKNOTE_HUES[idx % BANKNOTE_HUES.length];
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ink-2)] truncate max-w-[180px]">
                            {cat.name}
                          </span>
                          <Money amount={cat.amount} className="font-medium text-[var(--ink)]" />
                        </div>
                        {/* 4px horizontal bar in category color */}
                        <div className="h-1 w-full bg-[var(--sunken)] rounded-[2px] overflow-hidden">
                          <div
                            className="h-full rounded-[2px]"
                            style={{
                              width: `${Math.min(100, Math.max(2, cat.percent))}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recurring Transactions (Collapsed Section) */}
            <section aria-label="Recurring transactions" className="space-y-2">
              <button
                type="button"
                onClick={() => setIsRecurringExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs text-[var(--ink-3)] hover:text-[var(--ink)] py-1.5 cursor-pointer"
                aria-expanded={isRecurringExpanded}
              >
                <span className="font-medium text-[var(--ink-2)]">Recurring transactions</span>
                {isRecurringExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isRecurringExpanded && (
                <div className="pt-2">
                  <RecurringTransactions />
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showInitialSetup && (
        <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />
      )}

      {isFormOpen && (
        <TransactionForm onSubmit={addTransaction} onCancel={handleCloseForm} />
      )}

      {showBalanceManager && (
        <BalanceManager
          onlineBalance={onlineBalance}
          cashBalance={cashBalance}
          externalShowManager={showBalanceManager}
          setExternalShowManager={setShowBalanceManager}
          onBalanceUpdate={(newBal) =>
            setCurrentBalances((prev) => ({ ...prev, ...newBal }))
          }
        />
      )}

      {deleteConfirmation && (
        <DeleteConfirmationModal
          transaction={deleteConfirmation}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </>
  );
}
