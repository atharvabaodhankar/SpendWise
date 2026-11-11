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
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { X, History, RefreshCw, Loader2 } from "lucide-react";
import Money from "./Money";

export default function BalanceManager({ onlineBalance, cashBalance, externalShowManager, setExternalShowManager }) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  const [showManager, setShowManager] = useState(false);
  
  const isManagerOpen = externalShowManager !== undefined ? externalShowManager : showManager;
  const setManagerOpen = setExternalShowManager || setShowManager;
  const [adjustments, setAdjustments] = useState({
    online: "",
    cash: "",
    reason: "",
  });
  const [recentAdjustments, setRecentAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

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

    if (!adjustments.online && !adjustments.cash) {
      showError("Please enter at least one adjustment amount.");
      return;
    }

    if (!adjustments.reason.trim()) {
      showError("Please provide a reason for the adjustment.");
      return;
    }

    setLoading(true);

    try {
      const adjustmentData = {
        userId: currentUser.uid,
        onlineAdjustment: parseFloat(adjustments.online) || 0,
        cashAdjustment: parseFloat(adjustments.cash) || 0,
        reason: adjustments.reason.trim(),
        previousOnlineBalance: onlineBalance,
        previousCashBalance: cashBalance,
        createdAt: new Date(),
        date: new Date().toISOString().split("T")[0],
      };

      if (adjustments.online) {
        const onlineAmount = parseFloat(adjustments.online);
        await addDoc(collection(db, "transactions"), {
          type: onlineAmount > 0 ? "income" : "expense",
          amount: Math.abs(onlineAmount),
          category: "Balance Adjustment",
          description: `Online balance adjustment: ${adjustments.reason}`,
          paymentMethod: "online",
          date: new Date().toISOString().split("T")[0],
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true,
        });
      }

      if (adjustments.cash) {
        const cashAmount = parseFloat(adjustments.cash);
        await addDoc(collection(db, "transactions"), {
          type: cashAmount > 0 ? "income" : "expense",
          amount: Math.abs(cashAmount),
          category: "Balance Adjustment",
          description: `Cash balance adjustment: ${adjustments.reason}`,
          paymentMethod: "cash",
          date: new Date().toISOString().split("T")[0],
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true,
        });
      }

      await addDoc(collection(db, "balanceAdjustments"), adjustmentData);

      const newOnlineBalance = onlineBalance + (parseFloat(adjustments.online) || 0);
      const newCashBalance = cashBalance + (parseFloat(adjustments.cash) || 0);

      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          onlineBalance: newOnlineBalance,
          cashBalance: newCashBalance,
          updatedAt: new Date(),
        });
      } else {
        await setDoc(userDocRef, {
          onlineBalance: newOnlineBalance,
          cashBalance: newCashBalance,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await sendBalanceAdjustmentAlert({
        currentUser,
        adjustmentData,
        previousOnlineBalance: onlineBalance,
        previousCashBalance: cashBalance,
        newOnlineBalance: newOnlineBalance,
        newCashBalance: newCashBalance
      });

      setAdjustments({ online: "", cash: "", reason: "" });
      setManagerOpen(false);

      const totalAdjustment =
        (parseFloat(adjustments.online) || 0) +
        (parseFloat(adjustments.cash) || 0);
      showSuccess(
        `Balance adjusted successfully. Total change: ₹${totalAdjustment.toFixed(2)}`
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

            {/* Adjustment Form */}
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
                    Online adjustment
                  </label>
                  <input
                    type="number"
                    name="online"
                    value={adjustments.online}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="+/- 0.00"
                    className="input-base text-xs w-full tabular-nums"
                  />
                  <p className="text-xs text-[var(--ink-3)] mt-1">Positive to add, negative to deduct</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
                    Cash adjustment
                  </label>
                  <input
                    type="number"
                    name="cash"
                    value={adjustments.cash}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="+/- 0.00"
                    className="input-base text-xs w-full tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  name="reason"
                  value={adjustments.reason}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Correction, Found cash, Bank interest"
                  className="input-base text-xs w-full"
                />
              </div>

              {/* Projected Result */}
              {(adjustments.online || adjustments.cash) && (
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
                  Confirm adjustment
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
