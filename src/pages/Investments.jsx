import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  Coins,
  Gem,
  LineChart,
  Landmark,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Trash2,
  Calendar,
  Building,
  Sun,
  Moon,
  Users,
  Key,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  X,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  addInvestment,
  deleteInvestment,
} from "../utils/investmentService";
import {
  addSalary,
  deleteSalary,
} from "../utils/salaryService";
import AiChatbot from "../components/AiChatbot";
import SpendWiseLogo from "../components/SpendWiseLogo";
import SettingsModal from "../components/SettingsModal";
import FriendsManagerModal from "../components/friends/FriendsManagerModal";

const ASSET_TYPES = [
  { id: "gold", label: "Gold", icon: Coins, color: "#F59E0B" },
  { id: "silver", label: "Silver", icon: Gem, color: "#94A3B8" },
  { id: "mutual_fund", label: "Mutual Funds", icon: LineChart, color: "#10B981" },
  { id: "fd", label: "Fixed Deposits", icon: Landmark, color: "#3B82F6" },
  { id: "stocks", label: "Stocks / Equity", icon: TrendingUp, color: "#8B5CF6" },
  { id: "other", label: "Other Assets", icon: Layers, color: "#64748B" },
];

export default function Investments() {
  const { currentUser, logout } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Top Section Mode: "investments" | "salaries"
  const [activeView, setActiveView] = useState("investments");

  // Investments State
  const [investments, setInvestments] = useState([]);
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  // Salaries State
  const [salaries, setSalaries] = useState([]);
  const [loadingSalaries, setLoadingSalaries] = useState(true);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [submittingSalary, setSubmittingSalary] = useState(false);

  // Nav modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState("preferences");
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Investment Form State
  const [investmentForm, setInvestmentForm] = useState({
    name: "",
    assetType: "gold",
    provider: "PhonePe",
    investedAmount: "",
    currentValue: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Salary Form State
  const [salaryForm, setSalaryForm] = useState({
    salaryMonth: "",
    amount: "",
    receivedDate: new Date().toISOString().split("T")[0],
    companyOrSource: "",
    status: "received",
    notes: "",
  });

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

  // Subscribe to Investments
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "investments"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        items.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.purchaseDate || 0) - new Date(a.createdAt?.toDate?.() || a.purchaseDate || 0));
        setInvestments(items);
        setLoadingInvestments(false);
      },
      (err) => {
        console.error("Investments fetch error:", err);
        setLoadingInvestments(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to Salaries
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "salaries"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        items.sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0));
        setSalaries(items);
        setLoadingSalaries(false);
      },
      (err) => {
        console.error("Salaries fetch error:", err);
        setLoadingSalaries(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const username = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const initials = username.slice(0, 2).toUpperCase();

  // Aggregate metrics - Investments
  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.investedAmount || 0), 0);
  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + Number(inv.currentValue ?? inv.investedAmount ?? 0),
    0
  );
  const totalGain = totalCurrentValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const filteredInvestments =
    filterType === "all"
      ? investments
      : investments.filter((inv) => inv.assetType === filterType);

  // Aggregate metrics - Salaries
  const totalSalariesReceived = salaries
    .filter((s) => s.status === "received")
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const latestSalary = salaries[0];

  // Investment submission
  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    if (!investmentForm.name || !investmentForm.investedAmount) {
      showError("Please provide an investment name and amount.");
      return;
    }

    try {
      setSubmittingInvestment(true);
      await addInvestment(currentUser.uid, {
        ...investmentForm,
        investedAmount: parseFloat(investmentForm.investedAmount),
        currentValue: investmentForm.currentValue
          ? parseFloat(investmentForm.currentValue)
          : parseFloat(investmentForm.investedAmount),
      });
      showSuccess(`Logged ${investmentForm.name} investment!`);
      setShowInvestmentModal(false);
      setInvestmentForm({
        name: "",
        assetType: "gold",
        provider: "PhonePe",
        investedAmount: "",
        currentValue: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to add investment.");
    } finally {
      setSubmittingInvestment(false);
    }
  };

  // Salary submission
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryForm.salaryMonth || !salaryForm.amount) {
      showError("Please provide the salary month and amount.");
      return;
    }

    try {
      setSubmittingSalary(true);
      await addSalary(currentUser.uid, {
        ...salaryForm,
        amount: parseFloat(salaryForm.amount),
      });
      showSuccess(`Logged salary for ${salaryForm.salaryMonth}!`);
      setShowSalaryModal(false);
      setSalaryForm({
        salaryMonth: "",
        amount: "",
        receivedDate: new Date().toISOString().split("T")[0],
        companyOrSource: "",
        status: "received",
        notes: "",
      });
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to add salary.");
    } finally {
      setSubmittingSalary(false);
    }
  };

  const handleDeleteInvestment = async (id, name) => {
    if (!window.confirm(`Delete ${name || "this investment"}?`)) return;
    try {
      await deleteInvestment(currentUser.uid, id);
      showSuccess("Investment removed.");
    } catch (err) {
      showError(err.message || "Could not delete investment.");
    }
  };

  const handleDeleteSalary = async (id, month) => {
    if (!window.confirm(`Delete salary record for ${month || "this month"}?`)) return;
    try {
      await deleteSalary(currentUser.uid, id);
      showSuccess("Salary record removed.");
    } catch (err) {
      showError(err.message || "Could not delete salary.");
    }
  };

  const getAssetMeta = (type) =>
    ASSET_TYPES.find((a) => a.id === type) || ASSET_TYPES[5];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--slate)] font-sans antialiased transition-colors duration-200">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-40 bg-[var(--white)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <SpendWiseLogo size={32} />
            <span className="font-semibold text-[var(--navy)] tracking-tight text-base hidden sm:block">SpendWise</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--canvas)] transition-all">
              Dashboard
            </Link>
            <span className="px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--navy)] bg-[var(--slate-faint)] flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Investments & Salary
            </span>
            <Link to="/analytics" className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--canvas)] transition-all flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--slate)]" />}
            </button>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Friends"
            >
              <Users className="w-4 h-4 text-[var(--slate)]" />
            </button>
            <button
              onClick={() => { setSettingsTab('api'); setShowSettingsModal(true); }}
              className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="API & MCP Keys"
            >
              <Key className="w-4 h-4 text-[var(--slate)]" />
            </button>
            <button
              onClick={() => { setSettingsTab('preferences'); setShowSettingsModal(true); }}
              className="hidden sm:flex w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-[var(--slate)]" />
            </button>
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--white)] text-xs font-medium text-[var(--slate)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>

            {/* Avatar */}
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-[var(--navy)] items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white font-mono">{initials}</span>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden w-9 h-9 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex items-center justify-center hover:border-[var(--slate-light)] transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--slate)]" /> : <Menu className="w-5 h-5 text-[var(--slate)]" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 space-y-6 sm:space-y-8">
        
        {/* Toggleable Segmented Control: Investments vs Salaries */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex p-1 rounded-xl bg-[var(--slate-faint)] border border-[var(--hairline)]">
              <button
                onClick={() => setActiveView("investments")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all ${
                  activeView === "investments"
                    ? "bg-[var(--white)] text-[var(--navy)] shadow-sm"
                    : "text-[var(--slate)] hover:text-[var(--navy)]"
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Investments ({investments.length})</span>
              </button>

              <button
                onClick={() => setActiveView("salaries")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all ${
                  activeView === "salaries"
                    ? "bg-[var(--white)] text-[var(--navy)] shadow-sm"
                    : "text-[var(--slate)] hover:text-[var(--navy)]"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Salary Timeline ({salaries.length})</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {activeView === "investments" ? (
              <button
                onClick={() => setShowInvestmentModal(true)}
                className="btn-statement-primary flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-[11px]">Add Investment</span>
              </button>
            ) : (
              <button
                onClick={() => setShowSalaryModal(true)}
                className="btn-statement-primary flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-[11px]">Log Salary</span>
              </button>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════ */}
        {/* VIEW 1: INVESTMENTS & PORTFOLIO */}
        {/* ═════════════════════════════════════════════════ */}
        {activeView === "investments" && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header description */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--navy)] tracking-tight">
                Portfolio Holdings
              </h1>
              <p className="text-sm text-[var(--slate-light)] mt-0.5">
                Track gold, mutual funds, FDs, and precious assets in one place
              </p>
            </div>

            {/* Three Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Total Portfolio Value */}
              <div
                className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 shadow-[var(--shadow-statement)]"
                style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Coins className="w-4.5 h-4.5 text-amber-400" style={{ width: "18px", height: "18px" }} />
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                    {totalGain >= 0 ? "+" : ""}{gainPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-white/50 mb-1 font-mono">
                  Net Portfolio Value
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                  ₹{totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Card 2: Total Principal Invested */}
              <div className="rounded-2xl p-5 sm:p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-[var(--slate-light)]">Principal</span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">
                  Total Invested
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--navy)] tabular-nums">
                  ₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Card 3: Net Returns */}
              <div className="rounded-2xl p-5 sm:p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)]">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      totalGain >= 0
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {totalGain >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold ${
                      totalGain >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {totalGain >= 0 ? "Profit" : "Loss"}
                  </span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">
                  Net Returns
                </div>
                <div
                  className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${
                    totalGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {totalGain >= 0 ? "+" : ""}₹{totalGain.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Asset Allocation Bar */}
            {totalCurrentValue > 0 && (
              <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] p-5 shadow-[var(--shadow-statement)] space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--slate)] font-mono">
                  <span className="uppercase tracking-widest text-[10px] text-[var(--slate-light)]">Asset Allocation</span>
                  <span>{investments.length} Assets</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-[var(--slate-faint)]">
                  {ASSET_TYPES.map((type) => {
                    const typeVal = investments
                      .filter((i) => i.assetType === type.id)
                      .reduce((s, i) => s + Number(i.currentValue ?? i.investedAmount ?? 0), 0);
                    const pct = totalCurrentValue > 0 ? (typeVal / totalCurrentValue) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={type.id}
                        style={{ width: `${pct}%`, backgroundColor: type.color }}
                        className="h-full"
                        title={`${type.label}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--slate)]">
                  {ASSET_TYPES.map((type) => {
                    const count = investments.filter((i) => i.assetType === type.id).length;
                    if (count === 0) return null;
                    return (
                      <div key={type.id} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                        <span className="font-medium text-[var(--navy)]">{type.label}</span>
                        <span className="text-[var(--slate-light)] font-mono">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                  filterType === "all"
                    ? "bg-[var(--navy)] text-[var(--canvas)]"
                    : "bg-[var(--white)] text-[var(--slate)] border border-[var(--hairline)] hover:text-[var(--navy)]"
                }`}
              >
                All ({investments.length})
              </button>
              {ASSET_TYPES.map((type) => {
                const count = investments.filter((i) => i.assetType === type.id).length;
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFilterType(type.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                      filterType === type.id
                        ? "bg-[var(--navy)] text-[var(--canvas)]"
                        : "bg-[var(--white)] text-[var(--slate)] border border-[var(--hairline)] hover:text-[var(--navy)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: filterType === type.id ? "inherit" : type.color }} />
                    <span>{type.label}</span>
                    {count > 0 && <span className="opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Investments Ledger Table */}
            <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--navy)]">
                  Asset Holdings
                </h2>
                <span className="text-xs font-mono text-[var(--slate-light)]">
                  {filteredInvestments.length} records
                </span>
              </div>

              {loadingInvestments ? (
                <div className="p-12 text-center text-xs font-mono text-[var(--slate-light)]">
                  Loading portfolio data...
                </div>
              ) : filteredInvestments.length === 0 ? (
                <div className="p-12 text-center">
                  <Coins className="w-10 h-10 mx-auto text-amber-500/40 mb-3" />
                  <p className="text-sm font-medium text-[var(--navy)]">No investments logged yet</p>
                  <p className="text-xs text-[var(--slate-light)] mt-1">
                    Log an asset with the button above or tell SpendWise AI in chat.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--hairline)]">
                  {filteredInvestments.map((inv) => {
                    const meta = getAssetMeta(inv.assetType);
                    const Icon = meta.icon;
                    const invested = Number(inv.investedAmount || 0);
                    const current = Number(inv.currentValue ?? invested);
                    const gain = current - invested;
                    const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

                    return (
                      <div
                        key={inv.id}
                        className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-[var(--canvas)] transition-colors group"
                      >
                        {/* Left: Icon + Name + Platform */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-[var(--hairline)]"
                            style={{ backgroundColor: `${meta.color}15` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: meta.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--navy)] truncate">
                                {inv.name}
                              </span>
                              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--slate-faint)] text-[var(--slate)]">
                                {inv.provider || "Direct"}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--slate-light)] flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{inv.purchaseDate}</span>
                              {inv.notes && <span>· {inv.notes}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Right: Numbers + Delete */}
                        <div className="flex items-center gap-4 flex-shrink-0 text-right">
                          <div>
                            <div className="font-mono text-sm sm:text-base font-bold text-[var(--navy)] tabular-nums">
                              ₹{current.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[11px] font-mono flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[var(--slate-light)] hidden sm:inline">
                                ₹{invested.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`font-semibold ${
                                  gain >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {gain >= 0 ? "+" : ""}
                                {gainPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteInvestment(inv.id, inv.name)}
                            className="text-[var(--slate-light)] hover:text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════ */}
        {/* VIEW 2: SALARY TIMELINE & TRACKER */}
        {/* ═════════════════════════════════════════════════ */}
        {activeView === "salaries" && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header description */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--navy)] tracking-tight">
                Salary & Income Timeline
              </h1>
              <p className="text-sm text-[var(--slate-light)] mt-0.5">
                Keep a clear log of your monthly compensation, credit dates, and payout notes
              </p>
            </div>

            {/* Salary Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Total Salary Received */}
              <div
                className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 shadow-[var(--shadow-statement)]"
                style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Briefcase className="w-4.5 h-4.5 text-emerald-400" style={{ width: "18px", height: "18px" }} />
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                    {salaries.length} Payouts
                  </span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-white/50 mb-1 font-mono">
                  Cumulative Earnings
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                  ₹{totalSalariesReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Card 2: Most Recent Payout */}
              <div className="rounded-2xl p-5 sm:p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-[var(--slate-light)]">
                    {latestSalary?.salaryMonth || "None"}
                  </span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">
                  Latest Received
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--navy)] tabular-nums">
                  {latestSalary ? `₹${Number(latestSalary.amount).toLocaleString("en-IN")}` : "₹0.00"}
                </div>
                {latestSalary && (
                  <div className="text-[11px] text-[var(--slate-light)] mt-1 font-mono">
                    Credited on {latestSalary.receivedDate}
                  </div>
                )}
              </div>

              {/* Card 3: Payout Frequency / Average */}
              <div className="rounded-2xl p-5 sm:p-6 text-left bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-[var(--slate-light)]">Average</span>
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-[var(--slate-light)] mb-1 font-mono">
                  Monthly Avg
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--navy)] tabular-nums">
                  ₹{salaries.length > 0 ? (totalSalariesReceived / salaries.length).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "0"}
                </div>
                <div className="text-[11px] text-[var(--slate-light)] mt-1 font-mono">
                  Across {salaries.length} logged cycles
                </div>
              </div>
            </div>

            {/* Salary Timeline Stream */}
            <div className="rounded-xl bg-[var(--white)] border border-[var(--hairline)] shadow-[var(--shadow-statement)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--navy)]">
                  Disbursement History & Notes
                </h2>
                <span className="text-xs font-mono text-[var(--slate-light)]">
                  {salaries.length} credits
                </span>
              </div>

              {loadingSalaries ? (
                <div className="p-12 text-center text-xs font-mono text-[var(--slate-light)]">
                  Loading salary timeline...
                </div>
              ) : salaries.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-10 h-10 mx-auto text-emerald-500/40 mb-3" />
                  <p className="text-sm font-medium text-[var(--navy)]">No salary cycles logged yet</p>
                  <p className="text-xs text-[var(--slate-light)] mt-1">
                    Log your salary for each month (e.g. "Jun salary - 10k, got on 17th July").
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 py-6 pr-4 sm:pr-6 space-y-6 before:absolute before:left-8 sm:before:left-10 before:top-8 before:bottom-8 before:w-0.5 before:bg-[var(--slate-faint)]">
                  {salaries.map((sal) => (
                    <div key={sal.id} className="relative flex items-start gap-4 sm:gap-6 group">
                      {/* Timeline dot */}
                      <div className="w-4 h-4 rounded-full bg-[var(--white)] border-2 border-emerald-500 flex-shrink-0 mt-1 z-10 shadow-sm" />

                      {/* Card Content */}
                      <div className="flex-1 p-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)]/40 hover:bg-[var(--canvas)] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--navy)]">
                                {sal.salaryMonth}
                              </span>
                              {sal.companyOrSource && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--slate-faint)] text-[var(--slate)]">
                                  {sal.companyOrSource}
                                </span>
                              )}
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                                {sal.status || "Received"}
                              </span>
                            </div>
                            
                            {/* Notes pill (e.g. "got on 17th july") */}
                            {sal.notes ? (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--slate)] bg-[var(--white)] px-2.5 py-1 rounded-md border border-[var(--hairline)] inline-flex">
                                <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>{sal.notes}</span>
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-[var(--slate-light)] font-mono">
                                Credited on: {sal.receivedDate}
                              </div>
                            )}
                          </div>

                          {/* Amount and delete */}
                          <div className="flex items-center gap-4 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--hairline)]">
                            <div className="font-mono text-base sm:text-lg font-bold text-emerald-600 tabular-nums">
                              +₹{Number(sal.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                            <button
                              onClick={() => handleDeleteSalary(sal.id, sal.salaryMonth)}
                              className="text-[var(--slate-light)] hover:text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete cycle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: ADD INVESTMENT ── */}
      {showInvestmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--white)] border border-[var(--hairline)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <h2 className="text-base font-semibold text-[var(--navy)]">
                Log Investment
              </h2>
              <button
                onClick={() => setShowInvestmentModal(false)}
                className="p-1 rounded-lg text-[var(--slate)] hover:bg-[var(--slate-faint)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Asset Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASSET_TYPES.map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setInvestmentForm({ ...investmentForm, assetType: type.id })}
                      className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        investmentForm.assetType === type.id
                          ? "border-[var(--navy)] bg-[var(--navy)] text-white shadow-sm"
                          : "border-[var(--hairline)] text-[var(--slate)] hover:bg-[var(--canvas)]"
                      }`}
                    >
                      <type.icon className="w-3.5 h-3.5" />
                      <span>{type.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Name / Scheme
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24K Digital Gold, Parag Parikh Flexi Cap"
                  value={investmentForm.name}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PhonePe, Groww"
                    value={investmentForm.provider}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    required
                    value={investmentForm.purchaseDate}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Invested (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="10000"
                    value={investmentForm.investedAmount}
                    onChange={(e) =>
                      setInvestmentForm({
                        ...investmentForm,
                        investedAmount: e.target.value,
                        currentValue: investmentForm.currentValue || e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Current Worth (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Current value"
                    value={investmentForm.currentValue}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, currentValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SIP, certificate, maturity info"
                  value={investmentForm.notes}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setShowInvestmentModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--slate)] hover:bg-[var(--canvas)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvestment}
                  className="btn-statement-primary text-[11px]"
                >
                  {submittingInvestment ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOG SALARY ── */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--white)] border border-[var(--hairline)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <h2 className="text-base font-semibold text-[var(--navy)]">
                Log Salary
              </h2>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="p-1 rounded-lg text-[var(--slate)] hover:bg-[var(--slate-faint)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalarySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Salary Month / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jun salary, July, Aug 2026"
                  value={salaryForm.salaryMonth}
                  onChange={(e) => setSalaryForm({ ...salaryForm, salaryMonth: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="10000"
                    value={salaryForm.amount}
                    onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                    Credited On
                  </label>
                  <input
                    type="date"
                    required
                    value={salaryForm.receivedDate}
                    onChange={(e) => setSalaryForm({ ...salaryForm, receivedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Employer / Source (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Company name or Project client"
                  value={salaryForm.companyOrSource}
                  onChange={(e) => setSalaryForm({ ...salaryForm, companyOrSource: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[var(--slate-light)] mb-1">
                  Notes (e.g. Date received details)
                </label>
                <input
                  type="text"
                  placeholder="e.g. got on 17th july"
                  value={salaryForm.notes}
                  onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[var(--navy)]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--slate)] hover:bg-[var(--canvas)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSalary}
                  className="btn-statement-primary text-[11px]"
                >
                  {submittingSalary ? "Saving..." : "Log Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Integration */}
      <AiChatbot />

      {/* Settings & Friends Modals */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          activeTab={settingsTab}
        />
      )}
      {showFriendsModal && (
        <FriendsManagerModal
          isOpen={showFriendsModal}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </div>
  );
}
