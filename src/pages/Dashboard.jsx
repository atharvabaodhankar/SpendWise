import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
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
} from "firebase/firestore";
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Menu,
  X,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import BudgetGoals from "../components/BudgetGoals";
import { checkBalanceAlert, checkDailyExpenseAlert } from '../utils/emailAlerts';
import RecurringTransactions from "../components/RecurringTransactions";
import BalanceManager from "../components/BalanceManager";
import InitialBalanceSetup from "../components/InitialBalanceSetup";
import { exportToPDF, exportToExcel } from "../utils/exportUtils";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBalances, setCurrentBalances] = useState(null);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBalanceManager, setShowBalanceManager] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Load transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (querySnapshot) => {
        const transactionsData = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(transactionsData);
        setLoading(false);
      }
    );

    // Load current balances
    const balanceDoc = doc(db, "currentBalances", currentUser.uid);
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
      // Add transaction to database
      await addDoc(collection(db, "transactions"), {
        ...transactionData,
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      // Update current balance only if it's NOT a historical transaction
      if (!transactionData.isHistorical && currentBalances) {
        // Always subtract for expenses (no income anymore)
        const balanceChange = -transactionData.amount;
        const updatedBalances = {
          ...currentBalances,
          [transactionData.paymentMethod]:
            (currentBalances[transactionData.paymentMethod] || 0) +
            balanceChange,
          lastUpdated: new Date(),
          updatedBy: "transaction_add",
        };

        await setDoc(
          doc(db, "currentBalances", currentUser.uid),
          updatedBalances
        );

        // Check for balance alerts after updating balance
        await checkBalanceAlert(currentUser.email, updatedBalances, currentBalances);
      }

      // Check daily expense alerts
      const today = new Date().toISOString().split('T')[0];
      const todayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date === today)
        .reduce((sum, t) => sum + t.amount, 0) + transactionData.amount;
      
      await checkDailyExpenseAlert(currentUser.email, todayExpenses);

      setShowForm(false);

      // Show appropriate success message
      if (transactionData.isHistorical) {
        showSuccess(
          `Historical expense of ₹${transactionData.amount.toFixed(
            2
          )} recorded (current balance unchanged)`
        );
      } else {
        showSuccess(
          `Expense of ₹${transactionData.amount.toFixed(2)} added successfully!`
        );
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      showError("Failed to add transaction. Please try again.");
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      showSuccess("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showError("Failed to delete transaction. Please try again.");
    }
  };

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Use current balances (set by user initially, then updated by transactions)
  const onlineBalance = currentBalances ? currentBalances.online : 0;
  const cashBalance = currentBalances ? currentBalances.cash : 0;

  // Balance is now just current balances (no income tracking)
  const balance = onlineBalance + cashBalance;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="text-center animate-fade-scale">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="SpendWise Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xl font-semibold text-slate-700 mb-2">
            Loading SpendWise
          </div>
          <div className="w-32 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-indigo-800 to-slate-800 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show initial setup if no current balances are set
  if (showInitialSetup) {
    return (
      <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Premium Responsive Header */}
      <header className="glass-card border-0 border-b border-white/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="SpendWise Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  SpendWise
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Premium Financial Management
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">
                  Welcome back,
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {currentUser.email?.split("@")[0]}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/20 transition-all duration-200"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-white/20 py-4 animate-slide-down">
              <div className="space-y-4">
                {/* User Info */}
                <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600">
                    Welcome back,
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {currentUser.email?.split("@")[0]}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-indigo-800 to-slate-800 text-white rounded-xl hover:from-indigo-900 hover:to-slate-900 transition-all duration-300 font-medium shadow-lg"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>Add Expense</span>
                  </button>

                  <a
                    href="/analytics"
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>View Analytics</span>
                  </a>

                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowBalanceManager(true);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-slate-500 to-gray-600 text-white rounded-xl hover:from-slate-600 hover:to-gray-700 transition-all duration-300 font-medium shadow-lg"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Adjust Balances</span>
                  </button>

                  {transactions.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          exportToPDF(transactions);
                          showSuccess("Transactions exported to PDF successfully!");
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-medium shadow-lg"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Export PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          exportToExcel(transactions);
                          showSuccess("Transactions exported to Excel successfully!");
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg"
                      >
                        <Download className="h-5 w-5" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-slide-up">
          {/* Total Expenses Card */}
          <div className="premium-card bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border-rose-100/50 group">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-rose-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-rose-200 transition-all duration-300">
                    <TrendingDown className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-600 mb-1">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-rose-700">
                      ₹{totalExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Online Balance Card */}
          <div
            className={`premium-card group ${
              onlineBalance >= 0
                ? "bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 border-indigo-100/50"
                : "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-100/50"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      onlineBalance >= 0
                        ? "bg-gradient-to-r from-indigo-600 to-slate-700 group-hover:shadow-indigo-200"
                        : "bg-gradient-to-r from-orange-400 to-red-500 group-hover:shadow-orange-200"
                    }`}
                  >
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        onlineBalance >= 0 ? "text-indigo-700" : "text-orange-600"
                      }`}
                    >
                      Online Balance
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        onlineBalance >= 0 ? "text-indigo-800" : "text-orange-700"
                      }`}
                    >
                      ₹{onlineBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Balance Card */}
          <div
            className={`premium-card group ${
              cashBalance >= 0
                ? "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-yellow-100/50"
                : "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-100/50"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      cashBalance >= 0
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 group-hover:shadow-yellow-200"
                        : "bg-gradient-to-r from-orange-400 to-red-500 group-hover:shadow-orange-200"
                    }`}
                  >
                    <span className="text-2xl">💵</span>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        cashBalance >= 0 ? "text-amber-700" : "text-orange-600"
                      }`}
                    >
                      Cash Balance
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        cashBalance >= 0 ? "text-amber-800" : "text-orange-700"
                      }`}
                    >
                      ₹{cashBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Total Balance Summary */}
        <div className="mb-8 animate-fade-scale">
          <div
            className={`premium-card overflow-hidden ${
              balance >= 0
                ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200/50"
                : "bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 border-red-200/50"
            }`}
          >
            <div className="relative p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12"></div>
              </div>

              <div className="relative text-center">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl ${
                      balance >= 0
                        ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                        : "bg-gradient-to-r from-red-400 to-orange-500"
                    }`}
                  >
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                </div>

                <p className="text-lg font-semibold text-slate-600 mb-3">
                  Total Portfolio Balance
                </p>
                <p
                  className={`text-5xl lg:text-6xl font-bold mb-6 ${
                    balance >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  ₹{balance.toFixed(2)}
                </p>

                <div className="flex justify-center items-center space-x-8 text-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💳</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-500">
                        Online
                      </p>
                      <p
                        className={`font-bold ${
                          onlineBalance >= 0 ? "text-indigo-700" : "text-red-600"
                        }`}
                      >
                        ₹{onlineBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="w-px h-12 bg-slate-300"></div>

                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💵</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-500">Cash</p>
                      <p
                        className={`font-bold ${
                          cashBalance >= 0 ? "text-amber-700" : "text-red-600"
                        }`}
                      >
                        ₹{cashBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Action Buttons - Desktop Only */}
        <div className="mb-8 hidden lg:flex flex-wrap gap-4 justify-start">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-3 px-8 py-4 text-base font-semibold transform hover:scale-105 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Expense</span>
          </button>

          <a
            href="/analytics"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center space-x-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <BarChart3 className="h-5 w-5" />
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
                  showSuccess("Transactions exported to PDF successfully!");
                }}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:to-rose-700 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <FileText className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => {
                  exportToExcel(transactions);
                  showSuccess("Transactions exported to Excel successfully!");
                }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Balance Manager */}
        <BalanceManager
          onlineBalance={onlineBalance}
          cashBalance={cashBalance}
          externalShowManager={showBalanceManager}
          setExternalShowManager={setShowBalanceManager}
        />

        {/* Mobile Quick Action - Floating Add Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setShowForm(true)}
            className="w-14 h-14 bg-gradient-to-r from-indigo-800 to-slate-800 text-white rounded-full shadow-2xl hover:shadow-indigo-500/25 flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <PlusCircle className="h-6 w-6" />
          </button>
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
