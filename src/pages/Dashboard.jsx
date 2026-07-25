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
import AiChatbot from "../components/AiChatbot";

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
         // Create Debt Records, Mirror Transactions, and send emails with settle link
         const splitPromises = transactionData.splitDetails.map(async (friend) => {
            const friendAmount = transactionData.splitMode === 'custom'
               ? friend.customAmount
               : (transactionData.amount / (transactionData.splitDetails.length + 1));

            // 1. Create Debt Record and get its ID
            const debtRef = await addDoc(collection(db, 'debts'), {
               debtorId: friend.friendId,
               creditorId: currentUser.uid,
               amount: parseFloat(friendAmount),
               description: transactionData.description || transactionData.category,
               transactionId: docRef.id,
               status: 'unpaid',
               createdAt: new Date()
            });

            // 2. Create mirror transaction for friend
            await addDoc(collection(db, 'transactions'), {
               userId: friend.friendId,
               amount: parseFloat(friendAmount),
               type: 'expense',
               category: transactionData.category,
               description: `${transactionData.description || transactionData.category} (Split by ${currentUser.displayName || 'Friend'})`,
               date: transactionData.date,
               paymentMethod: 'owed',
               isSplit: true,
               paidBy: currentUser.uid,
               createdAt: new Date(),
               affectCurrentBalance: false
            });

            // 3. Generate settle token and send email with Pay button
            const settleToken = btoa(`${debtRef.id}:${import.meta.env.VITE_SETTLE_SECRET || 'spendwise'}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            await fetch('/api/send-email-gmail', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  type: 'bill_split',
                  userEmail: friend.email,
                  data: {
                     senderName: currentUser.displayName || currentUser.email,
                     amount: parseFloat(friendAmount).toFixed(2),
                     description: transactionData.description || transactionData.category,
                     debtId: debtRef.id,
                     settleToken,
                  }
               })
            });
         });

         Promise.all(splitPromises)
           .then(() => showSuccess(`Expense added & ${transactionData.splitDetails.length} friend(s) notified!`))
           .catch(err => console.error("Error creating debts/sending emails:", err));
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
      {/* Obsidian Glass Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10 bg-[#0b1326]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-[#10b981]/20 to-[#6366f1]/20 rounded-xl border border-white/10 shadow-lg shadow-[#10b981]/10">
                <img src="/logo.png" alt="SpendWise Logo" className="w-7 h-7 object-contain drop-shadow-md" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#f8fafc] to-[#94a3b8] bg-clip-text text-transparent" style={{ fontFamily: 'Geist, sans-serif' }}>SpendWise</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-5">
              <div className="text-right mr-3">
                <p className="text-xs text-[#94a3b8] font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>SIGNED IN AS</p>
                <p className="text-sm font-semibold text-white tracking-wide">{currentUser.email?.split("@")[0]}</p>
              </div>
              
              <button
                onClick={() => setShowFriendsModal(true)}
                className="btn-secondary p-2.5 rounded-xl hover:border-[#6366f1]/40 hover:text-[#818cf8] transition-all"
                title="Friends & Bill Split"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="btn-secondary p-2.5 rounded-xl hover:border-white/20 hover:text-white transition-all"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={logout}
                className="btn-secondary p-2.5 rounded-xl hover:border-[#f43f5e]/40 hover:text-[#f43f5e] transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-[#94a3b8] p-2 hover:text-white"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/10 bg-[#0b1326]/95 backdrop-blur-2xl absolute w-full z-50 animate-slide-up">
            <div className="px-4 py-6 space-y-4">
              <div className="pb-4 border-b border-white/10">
                <p className="text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>SIGNED IN AS</p>
                <p className="text-base font-semibold text-white">{currentUser.email}</p>
              </div>
              
              <button
                onClick={() => { setShowForm(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-primary justify-center"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add Expense</span>
              </button>
              
              <a
                href="/analytics"
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-secondary"
              >
                <BarChart3 className="w-5 h-5 text-[#818cf8]" />
                <span>Analytics</span>
              </a>
              
              {preferences.showBalances && (
              <button
                onClick={() => { setShowBalanceManager(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-secondary"
              >
                <Wallet className="w-5 h-5 text-[#10b981]" />
                <span>Adjust Balance</span>
              </button>
              )}
              
              <button
                onClick={() => { setShowFriendsModal(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-secondary"
              >
                <Users className="w-5 h-5 text-[#818cf8]" />
                <span>Friends & Bills</span>
              </button>

              <button
                onClick={() => { setShowSettingsModal(true); setShowMobileMenu(false); }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-secondary"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 rounded-xl btn-danger justify-center"
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
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>Financial Overview</h1>
            <p className="text-[#94a3b8] text-sm mt-1">Real-time command center for your spending and wallets</p>
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
              className="btn-secondary flex items-center space-x-2 border-white/10 hover:border-[#6366f1]/40"
            >
              <BarChart3 className="w-4 h-4 text-[#818cf8]" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Total Portfolio - Hero Obsidian Glass Card */}
           {preferences.showBalances && (
           <div className="glass-card p-6 relative overflow-hidden border border-[#10b981]/30 col-span-1 md:col-span-2 shadow-2xl shadow-[#10b981]/5">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-[#10b981]/15 border border-[#10b981]/30 rounded-xl backdrop-blur-md">
                    <Briefcase className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <span className="font-semibold text-xs tracking-wider text-[#94a3b8] uppercase" style={{ fontFamily: 'Geist, sans-serif' }}>TOTAL PORTFOLIO BALANCE</span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: 'Geist, sans-serif' }}>
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                 <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                    <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]"></div>
                      <span>Online: ₹{onlineBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                       <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
                      <span>Cash: ₹{cashBalance.toLocaleString('en-IN')}</span>
                    </div>
                 </div>
              </div>
              {/* Glowing Background Radial Accents */}
              <div className="absolute right-0 top-0 w-72 h-72 bg-[#6366f1]/15 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
              <div className="absolute bottom-0 right-10 w-48 h-48 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none"></div>
           </div>
           )}

           {/* Online Balance */}
           {preferences.showBalances && (
           <div className="glass-card p-6 flex flex-col justify-between hover:border-[#6366f1]/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                   <p className="label-premium">Online Wallet</p>
                   <h3 className="text-2xl font-bold text-white mt-2" style={{ fontFamily: 'Geist, sans-serif' }}>₹{onlineBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2.5 bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                   <div style={{ width: `${(onlineBalance / (balance || 1)) * 100}%` }} className="bg-gradient-to-r from-[#6366f1] to-[#818cf8] h-full rounded-full shadow-[0_0_8px_#6366f1]"></div>
                </span>
                <span className="ml-3 font-semibold text-white">{Math.round((onlineBalance / (balance || 1)) * 100)}%</span>
              </div>
           </div>
           )}

            {/* Cash Balance */}
           {preferences.showBalances && (
           <div className="glass-card p-6 flex flex-col justify-between hover:border-[#10b981]/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                   <p className="label-premium">Cash Wallet</p>
                   <h3 className="text-2xl font-bold text-white mt-2" style={{ fontFamily: 'Geist, sans-serif' }}>₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
               <div className="mt-4 flex items-center text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                <span className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                   <div style={{ width: `${(cashBalance / (balance || 1)) * 100}%` }} className="bg-gradient-to-r from-[#10b981] to-[#34d399] h-full rounded-full shadow-[0_0_8px_#10b981]"></div>
                </span>
                <span className="ml-3 font-semibold text-white">{Math.round((cashBalance / (balance || 1)) * 100)}%</span>
              </div>
           </div>
           )}

           {/* Total Expenses */}
           <div className="glass-card p-6 flex flex-col justify-between border-t-2 border-t-[#f43f5e]/60 hover:border-[#f43f5e]/40 transition-all">
               <div className="flex items-start justify-between">
                <div>
                   <p className="label-premium">Total Expenses</p>
                   <h3 className="text-2xl font-bold text-white mt-2" style={{ fontFamily: 'Geist, sans-serif' }}>₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="p-2.5 bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
               <div className="mt-2 text-xs text-[#64748b]">
                  Cumulative recorded outlays
               </div>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Left Column: Transactions List */}
           <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>Recent Transactions</h2>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => exportToPDF(transactions)}
                      className="btn-secondary text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-white/10 hover:border-white/20"
                    >
                      <Download className="w-3.5 h-3.5 text-[#10b981]" /> PDF
                    </button>
                     <button 
                      onClick={() => exportToExcel(transactions)}
                      className="btn-secondary text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-white/10 hover:border-white/20"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#818cf8]" /> Excel
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

      <AiChatbot
        mode="floating"
        suggestions={[
          "Which food am I eating overly this month?",
          "Add an expense of 120 for sugar cane juice paid by cash today",
          "Delete my latest balance adjustment",
        ]}
      />
    </div>
  );
}
