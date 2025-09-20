import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Repeat, Plus, Trash2, Play } from 'lucide-react';

const frequencies = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
};

export default function RecurringTransactions() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Bills',
    description: '',
    frequency: 'monthly'
  });

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Other'],
    expense: ['Bills', 'Rent', 'Subscription', 'Insurance', 'Other']
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'recurringTransactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recurringData = [];
      querySnapshot.forEach((doc) => {
        recurringData.push({ id: doc.id, ...doc.data() });
      });
      setRecurringTransactions(recurringData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'recurringTransactions'), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: currentUser.uid,
        createdAt: new Date(),
        lastExecuted: null,
        nextExecution: getNextExecutionDate(formData.frequency)
      });
      
      setShowForm(false);
      setFormData({
        type: 'expense',
        amount: '',
        category: 'Bills',
        description: '',
        frequency: 'monthly'
      });
      showSuccess('Recurring transaction created successfully!');
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      showError('Failed to create recurring transaction.');
    }
  };

  const deleteRecurring = async (id) => {
    try {
      await deleteDoc(doc(db, 'recurringTransactions', id));
      showSuccess('Recurring transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      showError('Failed to delete recurring transaction.');
    }
  };

  const executeNow = async (recurringTransaction) => {
    try {
      // Add the transaction
      await addDoc(collection(db, 'transactions'), {
        type: recurringTransaction.type,
        amount: recurringTransaction.amount,
        category: recurringTransaction.category,
        description: `${recurringTransaction.description} (Recurring)`,
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.uid,
        createdAt: new Date()
      });

      showSuccess(`Recurring ${recurringTransaction.type} of $${recurringTransaction.amount.toFixed(2)} executed!`);
    } catch (error) {
      console.error('Error executing recurring transaction:', error);
      showError('Failed to execute recurring transaction.');
    }
  };

  const getNextExecutionDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { category: categories[value][0] })
    }));
  };

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading recurring transactions...</div>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg sm:text-xl font-semibold truncate">Recurring Transactions</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Recurring</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900">Add Recurring Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories[formData.type].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(frequencies).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-base"
              >
                <span className="hidden sm:inline">Create Recurring Transaction</span>
                <span className="sm:hidden">Create</span>
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {recurringTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recurring transactions set up yet</p>
          <p className="text-gray-400 text-sm">Create recurring transactions for bills, salary, and other regular payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((transaction) => (
            <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type}
                  </span>
                  <span className="font-medium truncate">{transaction.description || transaction.category}</span>
                  <span className="hidden sm:inline text-gray-500">•</span>
                  <span className="text-gray-500 text-sm">{frequencies[transaction.frequency]}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {transaction.category} • ${transaction.amount.toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <button
                  onClick={() => executeNow(transaction)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors duration-150"
                  title="Execute now"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRecurring(transaction.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors duration-150"
                  title="Delete recurring transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}