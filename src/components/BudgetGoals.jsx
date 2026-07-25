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
    <div className="glass-card overflow-hidden flex flex-col border border-white/10 hover:border-white/20 transition-all">
       {/* Header */}
      <div className="p-6 border-b border-white/10 bg-[#0b1326]/50 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <div className="p-2.5 bg-[#10b981]/15 border border-[#10b981]/30 rounded-xl">
             <Target className="w-5 h-5 text-[#10b981]" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Monthly Budget</h3>
             <p className="text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
             </p>
           </div>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-xl text-[#94a3b8] hover:bg-white/10 hover:text-white transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={saveBudget}
              className="p-2 rounded-xl text-[#10b981] hover:bg-[#10b981]/20 transition-all"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="p-2 rounded-xl text-[#f43f5e] hover:bg-[#f43f5e]/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-center">
        {isEditing ? (
          <div className="space-y-4 animate-slide-up">
            <div>
              <label className="label-premium">Monthly Limit (₹)</label>
              <div className="relative">
                 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10b981] font-bold">₹</span>
                 <input
                   type="number"
                   value={budgetAmount}
                   onChange={(e) => setBudgetAmount(e.target.value)}
                   step="100"
                   min="0"
                   className="input-premium pl-9 text-lg font-bold"
                   placeholder="Enter limit"
                   autoFocus
                 />
              </div>
              <p className="text-xs text-[#64748b] mt-2">
                 Set a monthly target to monitor daily limit alerts.
              </p>
            </div>
          </div>
        ) : budget ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-2">
               <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle
                        className="text-white/10"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="72"
                        cy="72"
                     />
                     <circle
                        className={`${isOverBudget ? 'text-[#f43f5e]' : 'text-[#10b981]'} transition-all duration-1000 ease-out`}
                        strokeWidth="10"
                        strokeDasharray={365}
                        strokeDashoffset={365 - (Math.min(progressPercentage, 100) / 100) * 365}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="72"
                        cy="72"
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className={`text-3xl font-extrabold ${isOverBudget ? 'text-[#f43f5e]' : 'text-white'}`} style={{ fontFamily: 'Geist, sans-serif' }}>
                        {Math.round(progressPercentage)}%
                     </span>
                     <span className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-semibold" style={{ fontFamily: 'Geist, sans-serif' }}>Used</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-[#94a3b8] mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>Spent</p>
                  <p className={`text-lg font-bold ${isOverBudget ? 'text-[#f43f5e]' : 'text-white'}`} style={{ fontFamily: 'Geist, sans-serif' }}>
                     ₹{currentMonthExpenses.toFixed(0)}
                  </p>
               </div>
               <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-[#94a3b8] mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>Limit</p>
                  <p className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>
                     ₹{budget.monthlyLimit.toFixed(0)}
                  </p>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-[#94a3b8]">Remaining Budget</span>
                  <span className={`font-bold ${remaining < 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}`} style={{ fontFamily: 'Geist, sans-serif' }}>
                     {remaining < 0 ? '-' : ''}₹{Math.abs(remaining).toFixed(2)}
                  </span>
               </div>
               <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                     className={`h-full rounded-full transition-all duration-500 ${
                        isOverBudget 
                           ? 'bg-gradient-to-r from-[#f43f5e] to-[#e11d48] shadow-[0_0_10px_#f43f5e]' 
                           : 'bg-gradient-to-r from-[#10b981] to-[#34d399] shadow-[0_0_10px_#10b981]'
                     }`}
                     style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
               </div>
               {isOverBudget && (
                  <div className="flex items-start gap-2.5 text-xs text-[#f43f5e] bg-[#f43f5e]/15 border border-[#f43f5e]/30 p-3 rounded-xl">
                     <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                     <span>Monthly limit exceeded! Consider reviewing expenses.</span>
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#10b981]/15 border border-[#10b981]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-8 h-8 text-[#10b981]" />
            </div>
            <h4 className="text-white font-bold mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>No Budget Goal Set</h4>
            <p className="text-sm text-[#94a3b8] mb-4">Set a monthly limit to start tracking spending health.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary py-2.5 px-5 shadow-lg shadow-[#10b981]/20"
            >
              Set Budget Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}