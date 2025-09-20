import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Target, Edit2, Save, X } from 'lucide-react';

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
          monthlyExpenses += transaction.amount;
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
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading budget...</div>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-semibold truncate">Monthly Budget</h2>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={saveBudget}
              className="text-green-600 hover:text-green-700 p-1 rounded-md hover:bg-green-50 transition-colors duration-150"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Budget Limit (₹)
            </label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Enter your monthly budget"
            />
          </div>
        </div>
      ) : budget ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-600">Budget Limit:</span>
            <span className="text-base sm:text-lg font-semibold">₹{budget.monthlyLimit.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-600">Spent This Month:</span>
            <span className={`text-base sm:text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ₹{currentMonthExpenses.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base text-gray-600">Remaining:</span>
            <span className={`text-base sm:text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ₹{(budget.monthlyLimit - currentMonthExpenses).toFixed(2)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Progress</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${
                  isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            {isOverBudget && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                <p className="text-sm text-red-700 font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  You've exceeded your budget by ₹{(currentMonthExpenses - budget.monthlyLimit).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No budget set yet</p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Set Monthly Budget
          </button>
        </div>
      )}
    </div>
  );
}