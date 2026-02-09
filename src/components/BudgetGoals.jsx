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

  const progressPercentage = budget ? (currentMonthExpenses / budget.monthlyLimit) * 100 : 0;
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
    <div className="premium-card overflow-hidden flex flex-col">
       {/* Header */}
      <div className="p-6 border-b border-[var(--card-border)] bg-[var(--bg-secondary)]/30 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <div className="p-2 bg-[var(--primary-100)] rounded-lg">
             <Target className="w-5 h-5 text-[var(--primary-600)]" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-[var(--text-primary)]">Monthly Budget</h3>
             <p className="text-xs text-[var(--text-secondary)]">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
             </p>
           </div>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary-600)] transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={saveBudget}
              className="p-2 rounded-lg text-[var(--success-600)] hover:bg-[var(--success-50)] transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="p-2 rounded-lg text-[var(--danger-600)] hover:bg-[var(--danger-50)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {isEditing ? (
          <div className="space-y-4 animate-fade-scale">
            <div>
              <label className="label-premium">Monthly Limit (₹)</label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-bold">₹</span>
                 <input
                   type="number"
                   value={budgetAmount}
                   onChange={(e) => setBudgetAmount(e.target.value)}
                   step="100"
                   min="0"
                   className="input-premium pl-8 text-lg font-bold"
                   placeholder="Enter limit"
                   autoFocus
                 />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-2">
                 Set a realistic target based on your income and fixed expenses.
              </p>
            </div>
          </div>
        ) : budget ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-2">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Radial Progress Placeholder (CSS-only approximation or complex SVG) */}
                  {/* For simplicity/cleanliness, we'll use a circular representation */}
                  <svg className="w-full h-full transform -rotate-90">
                     <circle
                        className="text-[var(--bg-tertiary)]"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                     />
                     <circle
                        className={`${isOverBudget ? 'text-[var(--danger-500)]' : 'text-[var(--primary-500)]'} transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeDasharray={365}
                        strokeDashoffset={365 - (Math.min(progressPercentage, 100) / 100) * 365}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className={`text-2xl font-bold ${isOverBudget ? 'text-[var(--danger-600)]' : 'text-[var(--text-primary)]'}`}>
                        {Math.round(progressPercentage)}%
                     </span>
                     <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Used</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--card-border)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Spent</p>
                  <p className={`text-lg font-bold ${isOverBudget ? 'text-[var(--danger-600)]' : 'text-[var(--text-primary)]'}`}>
                     ₹{currentMonthExpenses.toFixed(0)}
                  </p>
               </div>
               <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--card-border)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Limit</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                     ₹{budget.monthlyLimit.toFixed(0)}
                  </p>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">Remaining Budget</span>
                  <span className={`font-bold ${remaining < 0 ? 'text-[var(--danger-600)]' : 'text-[var(--success-600)]'}`}>
                     {remaining < 0 ? '-' : ''}₹{Math.abs(remaining).toFixed(2)}
                  </span>
               </div>
               <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
                  <div
                     className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget 
                           ? 'bg-gradient-to-r from-rose-400 to-rose-600' 
                           : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                     }`}
                     style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
               </div>
               {isOverBudget && (
                  <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                     <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                     <span>You have exceeded your monthly limit. Please review your expenses.</span>
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--primary-50)] rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-8 h-8 text-[var(--primary-300)]" />
            </div>
            <h4 className="text-[var(--text-primary)] font-bold mb-1">No Budget Set</h4>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Take control of your spending by setting a monthly limit.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary py-2 px-4 shadow-lg shadow-blue-500/20"
            >
              Set Budget Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}