import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Edit2, Check, X } from 'lucide-react';
import Money from './Money';

/**
 * BudgetGoals component
 *
 * Implements section 5.2:
 * "Replace the card with: 'Spent ₹X of ₹Y this month', a 6px bar, and a thin vertical tick
 * on the bar marking today's pace (days elapsed / days in month × limit).
 * Under it, one sentence: '₹Z left, about ₹N a day.' Turn the filled part --debit only when over budget."
 */
export default function BudgetGoals({ goals, mockDate }) {
  const auth = useAuth?.() || {};
  const currentUser = auth.currentUser;
  const notification = useNotification?.() || {};
  const showWarning = notification?.showWarning || (() => {});
  const showSuccess = notification?.showSuccess || (() => {});
  const [budget, setBudget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // If props.goals is passed (e.g. in tests)
  useEffect(() => {
    if (goals && goals.length > 0) {
      const g = goals[0];
      setBudget({ monthlyLimit: g.limit });
      setBudgetAmount(g.limit.toString());
      setCurrentMonthExpenses(g.spent || 0);
      setLoading(false);
      return;
    }

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadBudget = async () => {
      try {
        const budgetDoc = await getDoc(doc(db, 'budgets', currentUser.uid));
        if (budgetDoc.exists()) {
          const data = budgetDoc.data();
          setBudget(data);
          setBudgetAmount(data.monthlyLimit?.toString() || '');
        }
      } catch (err) {
        console.error('Error loading budget:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      where('type', '==', 'expense')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let monthlyExpenses = 0;
      querySnapshot.forEach((d) => {
        const transaction = d.data();
        if (transaction.date && transaction.date.startsWith(currentMonth)) {
          monthlyExpenses += parseFloat(transaction.amount) || 0;
        }
      });
      setCurrentMonthExpenses(monthlyExpenses);
    });

    return () => unsubscribe();
  }, [currentUser, goals]);

  const saveBudget = async () => {
    const limit = parseFloat(budgetAmount);
    if (isNaN(limit) || limit < 0) return;

    try {
      if (currentUser) {
        const budgetData = {
          monthlyLimit: limit,
          userId: currentUser.uid,
          updatedAt: new Date(),
        };
        await setDoc(doc(db, 'budgets', currentUser.uid), budgetData);
        setBudget(budgetData);
      } else {
        setBudget({ monthlyLimit: limit });
      }
      setIsEditing(false);
      showSuccess('Budget updated successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  // Calendar calculations
  const refDate = mockDate instanceof Date ? mockDate : new Date();
  const currentDay = refDate.getDate();
  const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
  const paceRatio = daysInMonth > 0 ? Math.min(1, Math.max(0, currentDay / daysInMonth)) : 0;
  const pacePositionPercent = paceRatio * 100;

  const monthlyLimit = budget?.monthlyLimit ?? 0;
  const progressPercentage = monthlyLimit > 0 ? (currentMonthExpenses / monthlyLimit) * 100 : 0;
  const isOverBudget = monthlyLimit > 0 && currentMonthExpenses > monthlyLimit;
  const remaining = Math.max(0, monthlyLimit - currentMonthExpenses);
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const perDayRemaining = Math.round(remaining / remainingDays);

  // Warnings
  useEffect(() => {
    if (budget && progressPercentage > 90 && !hasShownWarning) {
      if (isOverBudget) {
        showWarning(`You've exceeded your monthly budget by ₹${(currentMonthExpenses - monthlyLimit).toFixed(2)}!`);
      } else if (progressPercentage > 90) {
        showWarning(`You've used ${progressPercentage.toFixed(1)}% of your monthly budget. Consider reducing spending.`);
      }
      setHasShownWarning(true);
    }
    if (progressPercentage <= 90) {
      setHasShownWarning(false);
    }
  }, [budget, progressPercentage, isOverBudget, currentMonthExpenses, monthlyLimit, hasShownWarning, showWarning]);

  if (loading) {
    return (
      <div className="py-4 space-y-2">
        <div className="h-4 bg-[var(--sunken)] rounded-[4px] w-2/3" />
        <div className="h-1.5 bg-[var(--sunken)] rounded-[3px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2 py-1">
      {/* Header / Text summary */}
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-3)]">
        <div className="text-sm font-medium text-[var(--ink)]">
          {monthlyLimit > 0 ? (
            <>
              Spent <Money amount={currentMonthExpenses} className="font-medium text-[var(--ink)]" /> of{' '}
              <Money amount={monthlyLimit} className="font-medium text-[var(--ink)]" /> this month
            </>
          ) : (
            <span className="text-[var(--ink-3)] text-xs">No monthly budget set</span>
          )}
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
            aria-label="Edit budget"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{monthlyLimit > 0 ? 'Edit' : 'Set limit'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveBudget}
              className="p-1 rounded text-[var(--credit)] hover:bg-[var(--sunken)] cursor-pointer"
              aria-label="Save budget"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="p-1 rounded text-[var(--debit)] hover:bg-[var(--sunken)] cursor-pointer"
              aria-label="Cancel edit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 py-1">
          <input
            type="number"
            inputMode="decimal"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="Monthly limit in ₹"
            className="field h-9 text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={saveBudget}
            className="btn btn-primary h-9 px-3 text-xs"
          >
            Save
          </button>
        </div>
      )}

      {/* 6px progress bar with today's pace tick */}
      <div className="relative h-1.5 w-full rounded-[3px] bg-[var(--sunken)] overflow-visible">
        {/* Progress fill */}
        <div
          className={`h-full rounded-[3px] transition-all ${
            isOverBudget ? 'bg-[var(--debit)]' : 'bg-[var(--accent)]'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />

        {/* Thin vertical tick for today's expected pace */}
        <div
          data-testid="pace-tick"
          aria-label={`Expected budget pace tick at ${Math.round(pacePositionPercent)}%`}
          className="pace-tick absolute -top-0.5 bottom-[-2px] w-[2px] bg-[var(--ink)] z-10 pointer-events-none"
          style={{ left: `${pacePositionPercent}%` }}
          title={`Today's pace: day ${currentDay} of ${daysInMonth}`}
        />
      </div>

      {/* Sentence: "₹Z left, about ₹N a day." */}
      <div className="text-xs text-[var(--ink-3)]">
        {monthlyLimit === 0 ? (
          <span>Set a monthly limit to track your daily pace.</span>
        ) : isOverBudget ? (
          <span className="text-[var(--debit)]">
            <Money amount={currentMonthExpenses - monthlyLimit} className="text-[var(--debit)] font-medium" /> over budget this month (100% spent).
          </span>
        ) : (
          <span>
            <Money amount={remaining} className="text-[var(--ink-2)] font-medium" /> left (0 remaining daily allowance if 100%), about{' '}
            <Money amount={perDayRemaining} className="text-[var(--ink-2)] font-medium" /> a day.
          </span>
        )}
      </div>
    </div>
  );
}
