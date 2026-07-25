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
  Users,
  Sun,
  Moon
} from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import BudgetGoals from "../components/BudgetGoals";
import BalanceTracker from "../components/BalanceTracker";
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

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const uniqueCategories = [...new Set(transactions.map(t => t.category))].length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
        <div className="w-10 h-10 border-2 border-[var(--slate-faint)] border-t-[var(--navy)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showInitialSetup) {
    return (
      <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--slate)] font-sans antialiased transition-colors duration-200">
      <div className="max-w-[1120px] mx-auto px-6 py-12 md:py-16 pb-24">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-8 border-b border-[var(--hairline)] mb-12">
          {/* Brand Identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--navy)] rounded-md flex items-center justify-center font-mono text-lg font-medium text-white shadow-md">
              S
            </div>
            <div className="brand-text">
              <div className="text-lg font-semibold tracking-wider text-[var(--navy)] uppercase">SpendWise</div>
              <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-medium mt-0.5">Statement view</div>
            </div>
          </div>

          {/* User Account & Actions */}
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block text-right">
              <div className="text-[9px] tracking-[1.5px] text-[var(--slate-light)] uppercase font-semibold">Signed in as</div>
              <div className="font-mono text-xs text-[var(--navy-muted)] mt-1 font-medium tracking-tight">
                {currentUser.email?.split("@")[0]}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md border border-[var(--slate-faint)] bg-[var(--white)] text-[var(--slate)] hover:text-[var(--navy)] hover:border-[var(--slate-light)] transition-all flex items-center justify-center"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[var(--navy)]" />}
            </button>

            <button
              onClick={() => setShowFriendsModal(true)}
              className="hidden md:flex items-center gap-1.5 btn-statement text-[10px]"
              title="Friends & Bill Split"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friends</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="hidden md:flex items-center gap-1.5 btn-statement text-[10px]"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={logout}
              className="btn-statement text-[10px] hover:border-[var(--rose)] hover:text-[var(--rose)]"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 inline mr-1" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Statement Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
          <div>
            <div className="text-xs tracking-[2px] text-[var(--slate-light)] uppercase mb-3 font-semibold">
              Cumulative outlay — all time
            </div>
            <div className="font-mono text-5xl md:text-6xl font-semibold tracking-[-2px] text-[var(--navy)] tabular-nums">
              ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-[var(--slate)] mt-3 font-normal">
              {transactions.length} entries recorded across {uniqueCategories || 1} categories
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a href="/analytics" className="btn-statement">
                View analytics
              </a>
              <button onClick={() => setShowForm(true)} className="btn-statement-primary">
                ＋ Add expense
              </button>
              {preferences.showBalances && (
                <button onClick={() => setShowBalanceManager(true)} className="btn-statement">
                  Adjust balance
                </button>
              )}
            </div>
          </div>

          <div className="stamp-pill self-start md:self-auto">
            Tracking active
          </div>
        </div>

        <hr className="border-none border-t border-[var(--hairline)] my-8 mb-12" />

        {/* Main Statement Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-16">
          {/* Left Column: Recent Entries Ledger */}
          <div className="space-y-6">
            <div className="flex items-baseline justify-between pb-3 border-b border-[var(--hairline)]">
              <h2 className="text-xs tracking-[2px] uppercase text-[var(--navy)] font-semibold m-0">
                Recent entries
              </h2>
              <span className="font-mono text-[10px] text-[var(--slate-light)]">
                {transactions.length} total records
              </span>
            </div>

            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteRequest}
            />
          </div>

          {/* Right Column: Passbook & Balance Cards */}
          <div className="space-y-10">
            <BudgetGoals />
            
            {preferences.showBalances && (
              <BalanceTracker onlineBalance={onlineBalance} cashBalance={cashBalance} totalBalance={balance} />
            )}
            
            <RecurringTransactions />
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setShowForm(true)}
          className="w-14 h-14 bg-[var(--navy)] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
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
          "Which category is my largest outlay this month?",
          "Add an expense of 120 for sugar cane juice paid by cash today",
          "What is my remaining budget?",
        ]}
      />
    </div>
  );
}
