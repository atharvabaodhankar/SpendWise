import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import BudgetGoals from '../components/BudgetGoals';
import RecurringTransactions from '../components/RecurringTransactions';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTransaction = async (transactionData) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        userId: currentUser.uid,
        createdAt: new Date()
      });
      setShowForm(false);
      showSuccess(`${transactionData.type === 'income' ? 'Income' : 'Expense'} of ₹${transactionData.amount.toFixed(2)} added successfully!`);
    } catch (error) {
      console.error('Error adding transaction:', error);
      showError('Failed to add transaction. Please try again.');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      showSuccess('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showError('Failed to delete transaction. Please try again.');
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">₹</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">SpendWise</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:block text-gray-700 text-sm">
                Welcome, {currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-red-700 transition-colors duration-200 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg shadow-md border border-green-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-lg shadow-md border border-red-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r p-6 rounded-lg shadow-md border ${
            balance >= 0 
              ? 'from-blue-50 to-indigo-50 border-blue-100' 
              : 'from-orange-50 to-red-50 border-orange-100'
          }`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ₹{balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Transaction</span>
          </button>
          <a
            href="/analytics"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <span>📊</span>
            <span>View Analytics</span>
          </a>
          {transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  exportToPDF(transactions);
                  showSuccess('Transactions exported to PDF successfully!');
                }}
                className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => {
                  exportToExcel(transactions);
                  showSuccess('Transactions exported to Excel successfully!');
                }}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span>Export Excel</span>
              </button>
            </div>
          )}
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <TransactionForm
            onSubmit={addTransaction}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Budget Goals and Recurring Transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <BudgetGoals />
          <RecurringTransactions />
        </div>

        {/* Transactions List */}
        <TransactionList 
          transactions={transactions} 
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}