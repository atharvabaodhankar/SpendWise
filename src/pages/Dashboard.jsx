import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, deleteDoc, doc, setDoc, getDoc,
} from "firebase/firestore";
import {
  PlusCircle, TrendingUp, TrendingDown, BarChart3,
  Settings, LogOut, Wallet, CreditCard, Users,
  Sun, Moon, Download, ChevronRight, Zap,
  ArrowUpRight, ArrowDownLeft, Activity
} from "lucide-react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import BudgetGoals from "../components/BudgetGoals";
import BalanceTracker from "../components/BalanceTracker";
import { checkBalanceAlert, checkDailyExpenseAlert } from "../utils/emailAlerts";
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
  const [showBalanceManager, setShowBalanceManager] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [preferences, setPreferences] = useState({ showBalances: true });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!currentUser) return;
    const loadPreferences = async () => {
      try {
        const docRef = doc(db, "userPreferences", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setPreferences(docSnap.data());
      } catch (e) { console.error(e); }
    };
    loadPreferences();

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (qs) => {
      const data = [];
      qs.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoading(false);
    });

    const balanceDoc = doc(db, "currentBalances", currentUser.uid);
    const unsubscribeBalances = onSnapshot(balanceDoc, (ds) => {
      if (ds.exists()) { setCurrentBalances(ds.data()); setShowInitialSetup(false); }
      else { setCurrentBalances(null); setShowInitialSetup(true); }
    });

    return () => { unsubscribeTransactions(); unsubscribeBalances(); };
  }, [currentUser]);

  const addTransaction = async (transactionData) => {
    try {
      let transactionToSave = { ...transactionData };
      let amountToDeduct = parseFloat(transactionData.amount);
      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
        const totalAmount = parseFloat(transactionData.amount);
        const splitCount = transactionData.splitDetails.length + 1;
        transactionToSave.amount = parseFloat((totalAmount / splitCount).toFixed(2));
        transactionToSave.totalPaid = totalAmount;
      } else {
        transactionToSave.amount = parseFloat(transactionData.amount);
      }
      const docRef = await addDoc(collection(db, "transactions"), {
        ...transactionToSave, userId: currentUser.uid, createdAt: new Date(),
      });
      if (transactionData.affectCurrentBalance && currentBalances) {
        const updatedBalances = {
          ...currentBalances,
          [transactionData.paymentMethod]: (currentBalances[transactionData.paymentMethod] || 0) - amountToDeduct,
          lastUpdated: new Date(), updatedBy: "transaction_add",
        };
        await setDoc(doc(db, "currentBalances", currentUser.uid), updatedBalances);
        await checkBalanceAlert(currentUser.email, updatedBalances, currentBalances);
      }
      const today = new Date().toISOString().split("T")[0];
      const todayExpenses = transactions
        .filter((t) => t.type === "expense" && t.date === today)
        .reduce((sum, t) => sum + t.amount, 0) + transactionToSave.amount;
      await checkDailyExpenseAlert(currentUser.email, todayExpenses);
      if (transactionData.isSplit && transactionData.splitDetails?.length > 0) {
        const splitPromises = transactionData.splitDetails.map(async (friend) => {
          const friendAmount = transactionData.splitMode === "custom"
            ? friend.customAmount
            : transactionData.amount / (transactionData.splitDetails.length + 1);
          const debtRef = await addDoc(collection(db, "debts"), {
            debtorId: friend.friendId, creditorId: currentUser.uid,
            amount: parseFloat(friendAmount),
            description: transactionData.description || transactionData.category,
            transactionId: docRef.id, status: "unpaid", createdAt: new Date(),
          });
          await addDoc(collection(db, "transactions"), {
            userId: friend.friendId, amount: parseFloat(friendAmount),
            type: "expense", category: transactionData.category,
            description: `${transactionData.description || transactionData.category} (Split by ${currentUser.displayName || "Friend"})`,
            date: transactionData.date, paymentMethod: "owed",
            isSplit: true, paidBy: currentUser.uid,
            createdAt: new Date(), affectCurrentBalance: false,
          });
          const settleToken = btoa(`${debtRef.id}:${import.meta.env.VITE_SETTLE_SECRET || "spendwise"}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          await fetch("/api/send-email-gmail", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "bill_split", userEmail: friend.email,
              data: { senderName: currentUser.displayName || currentUser.email,
                amount: parseFloat(friendAmount).toFixed(2),
                description: transactionData.description || transactionData.category,
                debtId: debtRef.id, settleToken } }),
          });
        });
        Promise.all(splitPromises)
          .then(() => showSuccess(`Expense added & ${transactionData.splitDetails.length} friend(s) notified!`))
          .catch((err) => console.error(err));
      } else {
        showSuccess(transactionData.isHistorical && !transactionData.affectCurrentBalance
          ? "Historical expense recorded (balance unchanged)" : "Expense added successfully!");
      }
      setShowForm(false);
    } catch (error) {
      console.error(error);
      showError("Failed to add transaction. Please try again.");
    }
  };

  const handleDeleteRequest = (t) => setDeleteConfirmation(t);
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await deleteDoc(doc(db, "transactions", deleteConfirmation.id));
      setDeleteConfirmation(null);
      showSuccess("Transaction deleted successfully!");
    } catch (e) { showError("Failed to delete transaction."); }
  };
  const handleCancelDelete = () => setDeleteConfirmation(null);

  // Derived stats
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const onlineBalance = currentBalances?.online ?? 0;
  const cashBalance = currentBalances?.cash ?? 0;
  const totalBalance = onlineBalance + cashBalance;
  const uniqueCategories = [...new Set(transactions.map((t) => t.category))].length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthExpenses = transactions
    .filter((t) => t.type === "expense" && t.date?.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);
  const thisMonthIncome = transactions
    .filter((t) => t.type === "income" && t.date?.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  const username = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const initials = username.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--slate-faint)] border-t-[var(--navy)] rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase text-[var(--slate-light)] font-mono">Loading</span>
        </div>
      </div>
    );
  }

  if (showInitialSetup) {
    return <InitialBalanceSetup onComplete={() => setShowInitialSetup(false)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--slate)] font-sans antialiased transition-colors duration-200">

      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-40 bg-[var(--white)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-[var(--navy)] rounded-lg flex items-center justify-center shadow-sm">
              <span className="font-mono text-sm font-bold text-white">S</span>
            </div>
            <span className="font-semibold text-[var(--navy)] tracking-tight text-base hidden sm:block">SpendWise</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <span className="px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--navy)] bg-[var(--slate-faint)]">Dashboard</span>
            <a href="/analytics" className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--canvas)] transition-all flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Toggle theme">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--slate)]" />}
            </button>
            <button onClick={() => setShowFriendsModal(true)}
              className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Friends">
              <Users className="w-4 h-4 text-[var(--slate)]" />
            </button>
            <button onClick={() => setShowSettingsModal(true)}
              className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Settings">
              <Settings className="w-4 h-4 text-[var(--slate)]" />
            </button>
            <button onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--white)] text-xs font-medium text-[var(--slate)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-all">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[var(--navy)] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white font-mono">{initials}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-28 space-y-8">

        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--navy)] tracking-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {username.split(" ")[0]}
            </h1>
            <p className="text-sm text-[var(--slate-light)] mt-0.5">
              {transactions.length} transactions · {uniqueCategories} categories
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToPDF(transactions, currentBalances)}
              className="btn-statement text-[10px] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => setShowForm(true)}
              className="btn-statement-primary flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="text-[11px]">Add expense</span>
            </button>
          </div>
        </div>

        {/* ── WALLET CARDS ── */}
        {preferences.showBalances && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Total Balance */}
            <button onClick={() => setShowBalanceManager(true)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)]"
              style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #1E293B 0%, #1E3A5F 100%)" }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Activity className="w-4.5 h-4.5 text-white" style={{width:"18px",height:"18px"}} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-white/50 mb-1 font-mono">Total balance</div>
                <div className="font-mono text-3xl font-bold text-white tabular-nums tracking-tight">
                  ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </button>

            {/* Online */}
            <button onClick={() => setShowBalanceManager(true)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--slate-faint)] group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">Online</div>
              <div className="font-mono text-2xl font-bold text-[var(--navy)] tabular-nums">
                ₹{onlineBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </button>

            {/* Cash */}
            <button onClick={() => setShowBalanceManager(true)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--slate-faint)] group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">Cash</div>
              <div className="font-mono text-2xl font-bold text-[var(--navy)] tabular-nums">
                ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </button>
          </div>
        )}

        {/* ── THIS MONTH STRIP ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Month income */}
          <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] p-4 flex items-center gap-4 shadow-[var(--shadow-statement)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--slate-light)] font-mono">This month income</div>
              <div className="font-mono text-lg font-bold text-emerald-600 tabular-nums mt-0.5">
                +₹{thisMonthIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Month expenses */}
          <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] p-4 flex items-center gap-4 shadow-[var(--shadow-statement)]">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--slate-light)] font-mono">This month spent</div>
              <div className="font-mono text-lg font-bold text-[var(--rose)] tabular-nums mt-0.5">
                −₹{thisMonthExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* All-time outlay */}
          <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] p-4 flex items-center gap-4 shadow-[var(--shadow-statement)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--slate-faint)] flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-[var(--slate)]" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--slate-light)] font-mono">All-time outlay</div>
              <div className="font-mono text-lg font-bold text-[var(--navy)] tabular-nums mt-0.5">
                ₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* ── BALANCE TRACKER (discrepancy alert — only if balances not recently adjusted) ── */}
        {preferences.showBalances && (() => {
          const txOnline = transactions
            .filter((t) => t.paymentMethod === "online" && !t.isBalanceAdjustment)
            .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
          const txCash = transactions
            .filter((t) => t.paymentMethod === "cash" && !t.isBalanceAdjustment)
            .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
          return (
            <BalanceTracker
              currentBalances={currentBalances}
              transactionOnlineBalance={txOnline}
              transactionCashBalance={txCash}
            />
          );
        })()}

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* LEFT: Transaction Ledger */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--navy)] uppercase tracking-wider">Recent transactions</h2>
                <p className="text-[11px] text-[var(--slate-light)] mt-0.5 font-mono">{transactions.length} total records</p>
              </div>
              <a href="/analytics"
                className="text-[11px] font-medium text-[var(--slate)] hover:text-[var(--navy)] flex items-center gap-1 transition-colors">
                View analytics <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-[var(--white)] rounded-2xl border border-[var(--hairline)] shadow-[var(--shadow-statement)] overflow-hidden">
              <div className="p-6">
                <TransactionList transactions={transactions} onDelete={handleDeleteRequest} />
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar widgets */}
          <div className="space-y-6">
            <BudgetGoals />
            <RecurringTransactions />
          </div>
        </div>
      </main>

      {/* ── MOBILE FAB ── */}
      <div className="md:hidden fixed bottom-6 right-6 z-30 flex flex-col items-center gap-3">
        <button onClick={() => setShowFriendsModal(true)}
          className="w-11 h-11 bg-[var(--white)] border border-[var(--hairline)] text-[var(--slate)] rounded-full shadow-lg flex items-center justify-center hover:border-[var(--slate-light)] transition-all">
          <Users className="w-4.5 h-4.5" style={{width:"18px",height:"18px"}} />
        </button>
        <button onClick={() => setShowForm(true)}
          className="w-14 h-14 bg-[var(--navy)] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* ── MODALS ── */}
      {showForm && <TransactionForm onSubmit={addTransaction} onCancel={() => setShowForm(false)} />}

      {showBalanceManager && preferences.showBalances && (
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
