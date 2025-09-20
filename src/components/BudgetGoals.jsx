import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Target, Edit2, Save, X } from 'lucide-react';

export default function BudgetGoals() {
  const { currentUser } = useAuth();
  const [budget, setBudget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const progressPercentage = budget ? (currentMonthExpenses / budget.monthlyLimit) * 100 : 0;
  const isOverBudget = progressPercentage > 100;

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading budget...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Monthly Budget</h2>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={saveBudget}
              className="text-green-600 hover:text-green-700"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBudgetAmount(budget ? budget.monthlyLimit.toString() : '');
              }}
              className="text-red-600 hover:text-red-700"
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
              Monthly Budget Limit ($)
            </label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your monthly budget"
            />
          </div>
        </div>
      ) : budget ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Budget Limit:</span>
            <span className="text-lg font-semibold">${budget.monthlyLimit.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Spent This Month:</span>
            <span className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${currentMonthExpenses.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Remaining:</span>
            <span className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${(budget.monthlyLimit - currentMonthExpenses).toFixed(2)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className={isOverBudget ? 'text-red-600' : 'text-gray-600'}>
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isOverBudget ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            {isOverBudget && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ You've exceeded your budget by ${(currentMonthExpenses - budget.monthlyLimit).toFixed(2)}
              </p>
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