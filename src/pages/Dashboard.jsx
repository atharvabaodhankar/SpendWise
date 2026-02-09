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
  getDoc,
} from "firebase/firestore";
import {
  PlusCircle,
  TrendingDown,
  Menu,
  X,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Wallet,
  CreditCard,
  Briefcase,
  Download,
  Users
} from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import BudgetGoals from "../components/BudgetGoals";
import { checkBalanceAlert, checkDailyExpenseAlert } from '../utils/emailAlerts';
import RecurringTransactions from "../components/RecurringTransactions";
import BalanceManager from "../components/BalanceManager";
import InitialBalanceSetup from "../components/InitialBalanceSetup";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { exportToPDF, exportToExcel } from "../utils/exportUtils";
import SettingsModal from "../components/SettingsModal";
import FriendsManagerModal from "../components/friends/FriendsManagerModal";

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
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [preferences, setPreferences] = useState({ showBalances: true });

  useEffect(() => {
    if (!currentUser) return;
    
    // Load user preferences
    const loadPreferences = async () => {
      try {
        const docRef = doc(db, 'userPreferences', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPreferences(docSnap.data());
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadPreferences();

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
      let transactionToSave = { ...transactionData };
      let amountToDeduct = parseFloat(transactionData.amount);

      // Handle Split Logic: Save "My Share" as amount, but deduct "Total" from balance
      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
         const totalAmount = parseFloat(transactionData.amount);
         const splitCount = transactionData.splitDetails.length + 1;
         const myShare = (totalAmount / splitCount).toFixed(2);
         
         transactionToSave.amount = parseFloat(myShare);
         transactionToSave.totalPaid = totalAmount; // Persist total paid for balance handling
      } else {
         transactionToSave.amount = parseFloat(transactionData.amount);
      }

      // Add transaction to database
      const docRef = await addDoc(collection(db, "transactions"), {
        ...transactionToSave,
        userId: currentUser.uid,
        createdAt: new Date(),
      });

      // Update current balance based on user's choice for historical transactions
      if (transactionData.affectCurrentBalance && currentBalances) {
        const balanceChange = -amountToDeduct; // Deduct the FULL amount paid
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
        .reduce((sum, t) => sum + t.amount, 0) + transactionToSave.amount;
      
      await checkDailyExpenseAlert(currentUser.email, todayExpenses);



      // Handle Split Bills - Send Emails & Create Debts
      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
         const splitAmount = (transactionData.amount / (transactionData.splitDetails.length + 1)).toFixed(2);
         
         // Create Debt Records & Mirror Transactions for Friends
         const debtPromises = transactionData.splitDetails.map(async (friend) => {
            // 1. Create Debt Record
            await addDoc(collection(db, 'debts'), {
               debtorId: friend.friendId,
               creditorId: currentUser.uid,
               amount: parseFloat(splitAmount),
               description: transactionData.description || transactionData.category,
               transactionId: docRef.id,
               status: 'unpaid',
               createdAt: new Date()
            });

            // 2. Create Transaction Record for Friend (so it shows in their dashboard)
            // We set affectCurrentBalance to false because they haven't paid it yet (it's a debt)
            await addDoc(collection(db, 'transactions'), {
               userId: friend.friendId,
               amount: parseFloat(splitAmount),
               type: 'expense',
               category: transactionData.category,
               description: `${transactionData.description || transactionData.category} (Split by ${currentUser.displayName || 'Friend'})`,
               date: transactionData.date,
               paymentMethod: 'owed', // Special method indicating it's unpaid/credit
               isSplit: true,
               paidBy: currentUser.uid,
               createdAt: new Date(),
               affectCurrentBalance: false 
            });
         });
         
         Promise.all(debtPromises).catch(err => console.error("Error creating debts/mirror transactions:", err));

         const emailPromises = transactionData.splitDetails.map(friend => {
            return fetch('/api/send-email-gmail', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  type: 'bill_split',
                  userEmail: friend.email,
                  data: {
                     senderName: currentUser.displayName || currentUser.email,
                     amount: splitAmount,
                     description: transactionData.description || transactionData.category
                  }
               })
            });
         });
         
         Promise.all(emailPromises).catch(err => console.error("Error sending split emails:", err));
         
         showSuccess(`Expense added & ${transactionData.splitDetails.length} friends notified!`);
      } else {
         if (transactionData.isHistorical && !transactionData.affectCurrentBalance) {
            showSuccess(`Historical expense recorded (balance unchanged)`);
         } else {
            showSuccess(`Expense added successfully!`);
         }
      }

      setShowForm(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
      showError("Failed to add transaction. Please try again.");
    }
  };

  const handleDeleteRequest = (transaction) => {
    setDeleteConfirmation(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    try {
      await deleteDoc(doc(db, "transactions", deleteConfirmation.id));
      setDeleteConfirmation(null);
      showSuccess("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showError("Failed to delete transaction. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const onlineBalance = currentBalances ? currentBalances.online : 0;
  const cashBalance = currentBalances ? currentBalances.cash : 0;
  const balance = onlineBalance + cashBalance;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--accent-500)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showInitialSetup) {
    return (
      <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
      {/* Premium Navbar */}
      <header className="glass-panel sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="SpendWise Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">SpendWise</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
               <div className="text-right mr-2">
                <p className="text-xs text-[var(--text-secondary)] font-medium">Signed in as</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{currentUser.email?.split("@")[0]}</p>
              </div>
              <button
                onClick={logout}
                className="text-[var(--text-secondary)] hover:text-[var(--danger-500)] transition-colors p-2 rounded-lg hover:bg-[var(--danger-50)]"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFriendsModal(true)}
                className="text-[var(--text-secondary)] hover:text-[var(--primary-600)] transition-colors p-2 rounded-lg hover:bg-[var(--primary-50)]"
                title="Friends"
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-[var(--text-secondary)] hover:text-[var(--primary-600)] transition-colors p-2 rounded-lg hover:bg-[var(--primary-50)]"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-[var(--text-secondary)] p-2"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl absolute w-full z-50 animate-slide-down">
            <div className="px-4 py-6 space-y-4">
               <div className="pb-4 border-b border-[var(--primary-100)]">
                <p className="text-sm text-[var(--text-secondary)]">Signed in as</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{currentUser.email}</p>
              </div>
              
              <button
                onClick={() => { setShowForm(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-[var(--primary-50)] text-[var(--primary-800)] font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add Expense</span>
              </button>
              
              <a
                href="/analytics"
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-[var(--primary-50)] text-[var(--text-secondary)] font-medium"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </a>
              
              {preferences.showBalances && (
              <button
                onClick={() => { setShowBalanceManager(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-[var(--primary-50)] text-[var(--text-secondary)] font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>Adjust Balance</span>
              </button>
              )}
              
              <button
                onClick={() => { setShowFriendsModal(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-[var(--primary-50)] text-[var(--text-secondary)] font-medium"
              >
                <Users className="w-5 h-5" />
                <span>Friends</span>
              </button>

              <button
                onClick={() => { setShowSettingsModal(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-[var(--primary-50)] text-[var(--text-secondary)] font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 rounded-xl text-[var(--danger-500)] hover:bg-[var(--danger-50)] font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Track your financial health</p>
          </div>
          
          <div className="hidden md:flex gap-3">
             {preferences.showBalances && (
              <BalanceManager
               onlineBalance={onlineBalance}
               cashBalance={cashBalance}
             />
             )}
             <a
              href="/analytics"
              className="btn-secondary flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
           {/* Total Portfolio - Hero Card */}
           {preferences.showBalances && (
           <div className="premium-card p-6 relative overflow-hidden bg-gradient-to-br from-[var(--primary-800)] to-[var(--primary-900)] text-white border-none col-span-1 md:col-span-2">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4 opacity-90">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-sm tracking-wide">TOTAL PORTFOLIO</span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold tracking-tight">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                 <div className="mt-6 flex space-x-6 text-sm text-[var(--primary-200)]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-400)]"></div>
                      <span>Online: ₹{onlineBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full bg-[var(--success-400)]"></div>
                      <span>Cash: ₹{cashBalance.toLocaleString('en-IN')}</span>
                    </div>
                 </div>
              </div>
              {/* Decorative shapes */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-[var(--accent-600)]/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 right-10 w-40 h-40 bg-[var(--primary-500)]/20 rounded-full blur-2xl"></div>
           </div>
           )}

           {/* Online Balance */}
           {preferences.showBalances && (
           <div className="premium-card p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Online</p>
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-2">₹{onlineBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2 bg-[var(--accent-50)] text-[var(--accent-600)] rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-[var(--text-secondary)]">
                <span className="w-full bg-[var(--primary-100)] h-1 rounded-full overflow-hidden">
                   <div style={{ width: `${(onlineBalance / (balance || 1)) * 100}%` }} className="bg-[var(--accent-500)] h-full rounded-full"></div>
                </span>
                <span className="ml-2">{Math.round((onlineBalance / (balance || 1)) * 100)}%</span>
              </div>
           </div>
           )}

            {/* Cash Balance */}
           {preferences.showBalances && (
           <div className="premium-card p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Cash</p>
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-2">₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2 bg-[var(--success-50)] text-[var(--success-600)] rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
               <div className="mt-4 flex items-center text-xs text-[var(--text-secondary)]">
                <span className="w-full bg-[var(--primary-100)] h-1 rounded-full overflow-hidden">
                   <div style={{ width: `${(cashBalance / (balance || 1)) * 100}%` }} className="bg-[var(--success-500)] h-full rounded-full"></div>
                </span>
                <span className="ml-2">{Math.round((cashBalance / (balance || 1)) * 100)}%</span>
              </div>
           </div>
           )}

           {/* Monthly Expenses */}
           <div className="premium-card p-6 flex flex-col justify-between border-t-4 border-t-[var(--danger-500)]">
               <div className="flex items-start justify-between">
                <div>
                   <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Expenses</p>
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-2">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2 bg-[var(--danger-50)] text-[var(--danger-500)] rounded-lg">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
               <div className="mt-2 text-xs text-[var(--text-secondary)]">
                  Lifetime spending
               </div>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Left Column: Transactions List */}
           <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Transactions</h2>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => exportToPDF(transactions)}
                      className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--primary-600)] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--primary-50)] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                     <button 
                      onClick={() => exportToExcel(transactions)}
                      className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--primary-600)] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--primary-50)] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Excel
                    </button>
                 </div>
              </div>
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteRequest}
              />
           </div>

           {/* Right Column: Budgets & Recurring */}
           <div className="space-y-8">
              <BudgetGoals />
              <RecurringTransactions />
           </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setShowForm(true)}
          className="w-14 h-14 bg-[var(--primary-900)] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      {showForm && (
        <TransactionForm
          onSubmit={addTransaction}
          onCancel={() => setShowForm(false)}
        />
      )}
      
      {/* Mobile Balance Manager */}
      {showBalanceManager && (
         <BalanceManager
          onlineBalance={onlineBalance}
          cashBalance={cashBalance}
          externalShowManager={showBalanceManager}
          setExternalShowManager={setShowBalanceManager}
        />
      )}

      <DeleteConfirmationModal
        transaction={deleteConfirmation}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpdatePreferences={setPreferences}
      />
      
      <FriendsManagerModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />
    </div>
  );
}
