import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Target, Edit2, Save, X, PieChart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function BudgetGoals() {
  const { currentUser } = useAuth();
  const { showWarning, showSuccess } = useNotification();
  const [budget, setBudget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Load budget
    const loadBudget = async () => {
      const budgetDoc = await getDoc(doc(db, 'budgets', currentUser.uid));
      if (budgetDoc.exists()) {
        setBudget(budgetDoc.data());
        setBudgetAmount(budgetDoc.data().monthlyLimit.toString());
      }
      setLoading(false);
    };

    loadBudget();

    // Listen to current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      where('type', '==', 'expense')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let monthlyExpenses = 0;
      querySnapshot.forEach((doc) => {
        const transaction = doc.data();
        if (transaction.date.startsWith(currentMonth)) {
           // Handle both string and number amounts just in case
          monthlyExpenses += parseFloat(transaction.amount);
        }
      });
      setCurrentMonthExpenses(monthlyExpenses);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const saveBudget = async () => {
    if (!budgetAmount || isNaN(budgetAmount)) return;

    try {
      const budgetData = {
        monthlyLimit: parseFloat(budgetAmount),
        userId: currentUser.uid,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'budgets', currentUser.uid), budgetData);
      setBudget(budgetData);
      setIsEditing(false);
      showSuccess('Budget updated successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const progressPercentage = budget && budget.monthlyLimit > 0
    ? (currentMonthExpenses / budget.monthlyLimit) * 100
    : 0;
  const isOverBudget = progressPercentage > 100;
  const remaining = budget ? budget.monthlyLimit - currentMonthExpenses : 0;

  // Show budget warnings
  useEffect(() => {
    if (budget && progressPercentage > 90 && !hasShownWarning) {
      if (isOverBudget) {
        showWarning(`You've exceeded your monthly budget by ₹${(currentMonthExpenses - budget.monthlyLimit).toFixed(2)}!`);
      } else if (progressPercentage > 90) {
        showWarning(`You've used ${progressPercentage.toFixed(1)}% of your monthly budget. Consider reducing spending.`);
      }
      setHasShownWarning(true);
    }
    
    // Reset warning flag when expenses go below 90%
    if (progressPercentage <= 90) {
      setHasShownWarning(false);
    }
  }, [budget, progressPercentage, isOverBudget, currentMonthExpenses, hasShownWarning, showWarning]);

  if (loading) {
    return <div className="premium-card p-6 animate-pulse h-64"></div>;
  }

  return (
    <div className="passbook-card">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Monthly budget</div>
          <div className="text-xl font-semibold text-[var(--navy)] tracking-tight mt-0.5">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-md text-[var(--slate-light)] hover:text-[var(--navy)] hover:bg-[var(--slate-faint)] transition-all"
            title="Edit Budget Goal"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={saveBudget}
              className="p-1.5 rounded-md text-[var(--emerald)] hover:bg-[var(--slate-faint)] transition-all"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="p-1.5 rounded-md text-[var(--rose)] hover:bg-[var(--slate-faint)] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="py-6 space-y-4">
          <div>
            <label className="label-premium">Monthly Limit (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--navy)] font-mono font-bold">₹</span>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                step="100"
                min="0"
                className="input-premium pl-9 font-mono text-base font-semibold"
                placeholder="Enter limit"
                autoFocus
              />
            </div>
            <p className="text-xs text-[var(--slate-light)] mt-2">
              Set a monthly limit to track spending health on your dashboard.
            </p>
          </div>
        </div>
      ) : budget ? (
        <div className="pt-6">
          {/* Progress Ruler */}
          <div className="h-2 w-full bg-[var(--slate-faint)] rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-700 ${isOverBudget ? 'bg-[var(--rose)]' : 'bg-[var(--navy)]'}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          {/* Ruler Ticks */}
          <div className="flex justify-between font-mono text-[10px] text-[var(--slate-light)] mt-2 mb-6">
            <span>₹0</span>
            <span>₹{(budget.monthlyLimit / 2).toFixed(0)}</span>
            <span>₹{budget.monthlyLimit.toFixed(0)}</span>
          </div>

          {/* Dotted Passbook Rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-dashed border-[var(--hairline)]">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--slate)] font-sans">Spent</span>
              <div className="flex-1 border-b border-dotted border-[var(--slate-light)] opacity-40 -mb-1"></div>
              <span className={`font-mono text-sm font-semibold tabular-nums ${isOverBudget ? 'text-[var(--rose)]' : 'text-[var(--navy)]'}`}>
                ₹{currentMonthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-3 py-2 border-b border-dashed border-[var(--hairline)]">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--slate)] font-sans">Limit</span>
              <div className="flex-1 border-b border-dotted border-[var(--slate-light)] opacity-40 -mb-1"></div>
              <span className="font-mono text-sm font-semibold text-[var(--navy)] tabular-nums">
                ₹{budget.monthlyLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-3 py-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--slate)] font-sans">Remaining</span>
              <div className="flex-1 border-b border-dotted border-[var(--slate-light)] opacity-40 -mb-1"></div>
              <span className={`font-mono text-sm font-semibold tabular-nums ${remaining < 0 ? 'text-[var(--rose)]' : 'text-[var(--emerald-dark)]'}`}>
                {remaining < 0 ? '-' : ''}₹{Math.abs(remaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Usage % Readout */}
          <div className="text-center pt-6 mt-4 border-t border-[var(--hairline)]">
            <div className="font-mono text-4xl font-semibold tracking-tight text-[var(--navy)] tabular-nums">
              {budget.monthlyLimit > 0 ? `${Math.round(progressPercentage)}%` : "—"}
            </div>
            <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] font-semibold mt-1">
              {budget.monthlyLimit > 0 ? "Of limit used" : "No limit set"}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-[var(--slate-faint)] rounded-lg flex items-center justify-center mx-auto mb-3">
            <PieChart className="w-6 h-6 text-[var(--slate-light)]" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--navy)] mb-1">No Budget Goal Set</h4>
          <p className="text-xs text-[var(--slate-light)] mb-4">Set a monthly limit to activate budget tracking.</p>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-statement text-[10px]"
          >
            Set Budget Goal
          </button>
        </div>
      )}
    </div>
  );
}