import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import { sendBalanceAdjustmentAlert } from "../utils/emailAlerts";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  setDoc,
} from "firebase/firestore";
import { X, History, RefreshCw, Loader2 } from "lucide-react";
import Money from "./Money";

export default function BalanceManager({ 
  onlineBalance = 0, 
  cashBalance = 0, 
  externalShowManager, 
  setExternalShowManager,
  onBalanceUpdate 
}) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  const [showManager, setShowManager] = useState(false);
  
  const isManagerOpen = externalShowManager !== undefined ? externalShowManager : showManager;
  const setManagerOpen = setExternalShowManager || setShowManager;
  
  // Mode: 'relative' (+/- adjustment) or 'exact' (set new exact balance)
  const [mode, setMode] = useState('exact');
  
  const [adjustments, setAdjustments] = useState({
    online: "",
    cash: "",
    reason: "",
  });

  const [exactBalances, setExactBalances] = useState({
    online: "",
    cash: "",
  });
  
  const [recentAdjustments, setRecentAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync initial exact balances when modal opens
  useEffect(() => {
    if (isManagerOpen) {
      setExactBalances({
        online: onlineBalance.toFixed(2),
        cash: cashBalance.toFixed(2),
      });
      setAdjustments({
        online: "",
        cash: "",
        reason: "",
      });
    }
  }, [isManagerOpen, onlineBalance, cashBalance]);

  useEffect(() => {
    if (!currentUser || !isManagerOpen) return;

    const q = query(
      collection(db, "balanceAdjustments"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const adjustmentsData = [];
      querySnapshot.forEach((doc) => {
        adjustmentsData.push({ id: doc.id, ...doc.data() });
      });
      setRecentAdjustments(adjustmentsData);
    });

    return () => unsubscribe();
  }, [currentUser, isManagerOpen]);

  const handleAdjustment = async (e) => {
    e.preventDefault();

    let onlineDelta = 0;
    let cashDelta = 0;
    let newOnlineBalance = onlineBalance;
    let newCashBalance = cashBalance;

    if (mode === 'exact') {
      const parsedOnline = exactBalances.online !== '' ? parseFloat(exactBalances.online) : onlineBalance;
      const parsedCash = exactBalances.cash !== '' ? parseFloat(exactBalances.cash) : cashBalance;

      if (isNaN(parsedOnline) || isNaN(parsedCash)) {
        showError("Please enter valid balance figures.");
        return;
      }

      onlineDelta = Number((parsedOnline - onlineBalance).toFixed(2));
      cashDelta = Number((parsedCash - cashBalance).toFixed(2));
      newOnlineBalance = parsedOnline;
      newCashBalance = parsedCash;

      if (Math.abs(onlineDelta) < 0.001 && Math.abs(cashDelta) < 0.001) {
        showError("No changes made to the balances.");
        return;
      }
    } else {
      if (!adjustments.online && !adjustments.cash) {
        showError("Please enter at least one adjustment amount.");
        return;
      }

      onlineDelta = parseFloat(adjustments.online) || 0;
      cashDelta = parseFloat(adjustments.cash) || 0;
      newOnlineBalance = Number((onlineBalance + onlineDelta).toFixed(2));
      newCashBalance = Number((cashBalance + cashDelta).toFixed(2));
    }

    const reason = (adjustments.reason || '').trim() || (mode === 'exact' ? 'Balance calibration' : 'Balance adjustment');

    setLoading(true);

    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const adjustmentData = {
        userId: currentUser.uid,
        onlineAdjustment: onlineDelta,
        cashAdjustment: cashDelta,
        reason,
        previousOnlineBalance: onlineBalance,
        previousCashBalance: cashBalance,
        newOnlineBalance,
        newCashBalance,
        createdAt: new Date(),
        date: todayDate,
      };

      if (onlineDelta !== 0) {
        await addDoc(collection(db, "transactions"), {
          type: onlineDelta > 0 ? "income" : "expense",
          amount: Math.abs(onlineDelta),
          category: "Balance Adjustment",
          description: `Online balance adjustment: ${reason}`,
          paymentMethod: "online",
          date: todayDate,
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true,
        });
      }

      if (cashDelta !== 0) {
        await addDoc(collection(db, "transactions"), {
          type: cashDelta > 0 ? "income" : "expense",
          amount: Math.abs(cashDelta),
          category: "Balance Adjustment",
          description: `Cash balance adjustment: ${reason}`,
          paymentMethod: "cash",
          date: todayDate,
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true,
        });
      }

      await addDoc(collection(db, "balanceAdjustments"), adjustmentData);

      // ── CRITICAL: Update currentBalances collection that Dashboard.jsx, InitialBalanceSetup, and BalanceTracker rely on! ──
      const currentBalancesRef = doc(db, "currentBalances", currentUser.uid);
      await setDoc(currentBalancesRef, {
        online: newOnlineBalance,
        cash: newCashBalance,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Update user doc for backwards compatibility
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        onlineBalance: newOnlineBalance,
        cashBalance: newCashBalance,
        updatedAt: new Date(),
      }, { merge: true });

      // Notify parent Dashboard state immediately for zero-latency local update
      if (onBalanceUpdate) {
        onBalanceUpdate({ online: newOnlineBalance, cash: newCashBalance });
      }

      await sendBalanceAdjustmentAlert({
        currentUser,
        adjustmentData,
        previousOnlineBalance: onlineBalance,
        previousCashBalance: cashBalance,
        newOnlineBalance,
        newCashBalance
      });

      setAdjustments({ online: "", cash: "", reason: "" });
      setManagerOpen(false);

      showSuccess(
        `Balances updated successfully. Online: ₹${newOnlineBalance.toFixed(2)}, Cash: ₹${newCashBalance.toFixed(2)}`
      );
    } catch (error) {
      console.error("Error adjusting balance:", error);
      showError("Failed to adjust balance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdjustments((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      {isManagerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setManagerOpen(false);
            }
          }}
        >
          <div 
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[var(--line)]">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--ink)]">Edit balances</h2>
                <p className="text-xs text-[var(--ink-3)] mt-0.5">Calibrate your Online and Cash wallet records.</p>
              </div>
              <button
                onClick={() => setManagerOpen(false)}
                className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current balances */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)]">
              <div>
                <p className="text-xs text-[var(--ink-3)]">Online account</p>
                <div className="mt-1">
                  <Money amount={onlineBalance} size="title" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-3)]">Cash in hand</p>
                <div className="mt-1">
                  <Money amount={cashBalance} size="title" />
                </div>
              </div>
            </div>

            {/* Mode Selector Toggle: Set exact balance vs Add/Deduct */}
            <div className="flex items-center gap-1 bg-[var(--sunken)] p-0.5 rounded-[6px] w-fit">
              <button
                type="button"
                onClick={() => setMode('exact')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  mode === 'exact'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                Set exact balance
              </button>
              <button
                type="button"
                onClick={() => setMode('relative')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  mode === 'relative'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                }`}
              >
                Add / Deduct (+/−)
              </button>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleAdjustment} className="space-y-4">
              {mode === 'exact' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="exact-online">
                      Exact online balance (₹)
                    </label>
                    <input
                      id="exact-online"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={exactBalances.online}
                      onChange={(e) => setExactBalances((p) => ({ ...p, online: e.target.value }))}
                      placeholder={onlineBalance.toFixed(2)}
                      className="field h-10 text-xs w-full tabular-nums"
                    />
                    <p className="text-xs text-[var(--ink-3)] mt-1">Directly set your actual bank/UPI balance</p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="exact-cash">
                      Exact cash in hand (₹)
                    </label>
                    <input
                      id="exact-cash"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={exactBalances.cash}
                      onChange={(e) => setExactBalances((p) => ({ ...p, cash: e.target.value }))}
                      placeholder={cashBalance.toFixed(2)}
                      className="field h-10 text-xs w-full tabular-nums"
                    />
                    <p className="text-xs text-[var(--ink-3)] mt-1">Directly set your real physical cash</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="relative-online">
                      Online adjustment
                    </label>
                    <input
                      id="relative-online"
                      type="number"
                      name="online"
                      step="any"
                      inputMode="decimal"
                      value={adjustments.online}
                      onChange={handleChange}
                      placeholder="+/- 0.00"
                      className="field h-10 text-xs w-full tabular-nums"
                    />
                    <p className="text-xs text-[var(--ink-3)] mt-1">Positive to add, negative to deduct</p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="relative-cash">
                      Cash adjustment
                    </label>
                    <input
                      id="relative-cash"
                      type="number"
                      name="cash"
                      step="any"
                      inputMode="decimal"
                      value={adjustments.cash}
                      onChange={handleChange}
                      placeholder="+/- 0.00"
                      className="field h-10 text-xs w-full tabular-nums"
                    />
                    <p className="text-xs text-[var(--ink-3)] mt-1">Positive to add, negative to deduct</p>
                  </div>
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="balance-reason">
                  Reason {mode === 'relative' && '*'}
                </label>
                <input
                  id="balance-reason"
                  type="text"
                  name="reason"
                  value={adjustments.reason}
                  onChange={handleChange}
                  required={mode === 'relative'}
                  placeholder={mode === 'exact' ? "e.g. Wallet recalibration (optional)" : "e.g. Correction, Found cash, Bank interest"}
                  className="field h-10 text-xs w-full"
                />
              </div>

              {/* Projected Result */}
              {mode === 'exact' ? (
                (exactBalances.online !== onlineBalance.toFixed(2) || exactBalances.cash !== cashBalance.toFixed(2)) && (
                  <div className="p-3 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)] text-xs space-y-1.5">
                    <p className="font-medium text-[var(--ink)]">Resulting balances</p>
                    <div className="flex justify-between items-center text-[var(--ink-2)] tabular-nums">
                      <span>Online:</span>
                      <span>
                        ₹{onlineBalance.toFixed(2)} → ₹{Number(exactBalances.online || onlineBalance).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[var(--ink-2)] tabular-nums">
                      <span>Cash:</span>
                      <span>
                        ₹{cashBalance.toFixed(2)} → ₹{Number(exactBalances.cash || cashBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                (adjustments.online || adjustments.cash) && (
                  <div className="p-3 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)] text-xs space-y-1.5">
                    <p className="font-medium text-[var(--ink)]">Projected balance</p>
                    {adjustments.online && (
                      <div className="flex justify-between items-center text-[var(--ink-2)] tabular-nums">
                        <span>Online:</span>
                        <span>
                          ₹{onlineBalance.toFixed(2)} → ₹{(onlineBalance + (parseFloat(adjustments.online) || 0)).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {adjustments.cash && (
                      <div className="flex justify-between items-center text-[var(--ink-2)] tabular-nums">
                        <span>Cash:</span>
                        <span>
                          ₹{cashBalance.toFixed(2)} → ₹{(cashBalance + (parseFloat(adjustments.cash) || 0)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagerOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Save balance
                </button>
              </div>
            </form>

            {/* History */}
            {recentAdjustments.length > 0 && (
              <div className="pt-4 border-t border-[var(--line)] space-y-2">
                <h4 className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                  Recent calibrations
                </h4>
                <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[6px] overflow-hidden">
                  {recentAdjustments.map((adj) => (
                    <div key={adj.id} className="p-2.5 bg-[var(--surface)] text-xs flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[var(--ink)]">{adj.reason}</p>
                        <p className="text-xs text-[var(--ink-3)]">
                          {adj.createdAt?.toDate ? new Date(adj.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        {adj.onlineAdjustment !== 0 && (
                          <div className={adj.onlineAdjustment > 0 ? 'text-[var(--credit)]' : 'text-[var(--debit)]'}>
                            Online: {adj.onlineAdjustment > 0 ? '+' : ''}{adj.onlineAdjustment}
                          </div>
                        )}
                        {adj.cashAdjustment !== 0 && (
                          <div className={adj.cashAdjustment > 0 ? 'text-[var(--credit)]' : 'text-[var(--debit)]'}>
                            Cash: {adj.cashAdjustment > 0 ? '+' : ''}{adj.cashAdjustment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
