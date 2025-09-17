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
import BalanceManager from '../components/BalanceManager';
import BalanceTracker from '../components/BalanceTracker';
import InitialBalanceSetup from '../components/InitialBalanceSetup';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBalances, setCurrentBalances] = useState(null);
  const [showInitialSetup, setShowInitialSetup] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    // Load transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionsData);
      setLoading(false);
    });
    
    // Load current balances
    const balanceDoc = doc(db, 'currentBalances', currentUser.uid);
    const unsubscribeBalances = onSnapshot(balanceDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setCurrentBalances(docSnapshot.data());
        setShowInitialSetup(false);
      } else {
        // No current balances found, show initial setup
        setCurrentBalances(null);
        setShowInitialSetup(true);
      }
    });
    
    return () => {
      unsubscribeTransactions();
      unsubscribeBalances();
    };
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

  // Calculate transaction-based balances for comparison
  const transactionOnlineIncome = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'online')
    .reduce((sum, t) => sum + t.amount, 0);

  const transactionOnlineExpenses = transactions
    .filter(t => t.type === 'expense' && t.paymentMethod === 'online')
    .reduce((sum, t) => sum + t.amount, 0);

  const transactionCashIncome = transactions
    .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const transactionCashExpenses = transactions
    .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  // Use current balances if available, otherwise fall back to transaction-based calculation
  const onlineBalance = currentBalances ? currentBalances.online : (transactionOnlineIncome - transactionOnlineExpenses);
  const cashBalance = currentBalances ? currentBalances.cash : (transactionCashIncome - transactionCashExpenses);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center animate-fade-scale">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">₹</span>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Loading SpendWise</div>
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show initial setup if no current balances are set
  if (showInitialSetup) {
    return <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Premium Header */}
      <header className="glass-card border-0 border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <span className="text-white text-lg font-bold">₹</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  SpendWise
                </h1>
                <p className="text-sm text-gray-500 font-medium">Premium Financial Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-600">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {currentUser.email?.split('@')[0]}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Tracker - Shows discrepancy warnings */}
        {currentBalances && (
          <BalanceTracker
            currentBalances={currentBalances}
            transactionOnlineBalance={transactionOnlineIncome - transactionOnlineExpenses}
            transactionCashBalance={transactionCashIncome - transactionCashExpenses}
            onBalanceUpdate={setCurrentBalances}
          />
        )}

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          {/* Total Income Card */}
          <div className="premium-card bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-100/50 group">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-all duration-300">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{totalIncome.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="premium-card bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border-rose-100/50 group">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-rose-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-rose-200 transition-all duration-300">
                    <TrendingDown className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-600 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-rose-700">₹{totalExpenses.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Online Balance Card */}
          <div className={`premium-card group ${
            onlineBalance >= 0 
              ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border-blue-100/50' 
              : 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-100/50'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    onlineBalance >= 0 
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500 group-hover:shadow-blue-200' 
                      : 'bg-gradient-to-r from-orange-400 to-red-500 group-hover:shadow-orange-200'
                  }`}>
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${
                      onlineBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>Online Balance</p>
                    <p className={`text-2xl font-bold ${
                      onlineBalance >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>₹{onlineBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Balance Card */}
          <div className={`premium-card group ${
            cashBalance >= 0 
              ? 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-purple-100/50' 
              : 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-100/50'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    cashBalance >= 0 
                      ? 'bg-gradient-to-r from-purple-400 to-violet-500 group-hover:shadow-purple-200' 
                      : 'bg-gradient-to-r from-orange-400 to-red-500 group-hover:shadow-orange-200'
                  }`}>
                    <span className="text-2xl">💵</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${
                      cashBalance >= 0 ? 'text-purple-600' : 'text-orange-600'
                    }`}>Cash Balance</p>
                    <p className={`text-2xl font-bold ${
                      cashBalance >= 0 ? 'text-purple-700' : 'text-orange-700'
                    }`}>₹{cashBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Total Balance Summary */}
        <div className="mb-8 animate-fade-scale">
          <div className={`premium-card overflow-hidden ${
            balance >= 0 
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200/50' 
              : 'bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 border-red-200/50'
          }`}>
            <div className="relative p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12"></div>
              </div>
              
              <div className="relative text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl ${
                    balance >= 0 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                      : 'bg-gradient-to-r from-red-400 to-orange-500'
                  }`}>
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <p className="text-lg font-semibold text-gray-600 mb-3">Total Portfolio Balance</p>
                <p className={`text-5xl lg:text-6xl font-bold mb-6 ${
                  balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  ₹{balance.toFixed(2)}
                </p>
                
                <div className="flex justify-center items-center space-x-8 text-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💳</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-500">Online</p>
                      <p className={`font-bold ${onlineBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{onlineBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-px h-12 bg-gray-300"></div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💵</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-500">Cash</p>
                      <p className={`font-bold ${cashBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        ₹{cashBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center lg:justify-start">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-3 px-8 py-4 text-base font-semibold transform hover:scale-105 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Transaction</span>
          </button>
          
          <a
            href="/analytics"
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center space-x-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <span className="text-lg">📊</span>
            <span>View Analytics</span>
          </a>
          
          <BalanceManager 
            onlineBalance={onlineBalance}
            cashBalance={cashBalance}
          />
          
          {transactions.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  exportToPDF(transactions);
                  showSuccess('Transactions exported to PDF successfully!');
                }}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:to-rose-700 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => {
                  exportToExcel(transactions);
                  showSuccess('Transactions exported to Excel successfully!');
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl hover:from-emerald-600 hover:to-green-700 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
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