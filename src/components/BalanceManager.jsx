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
import { Settings, Edit3, Save, X, History, TrendingUp, TrendingDown, RefreshCw, CreditCard, Wallet, Loader2 } from "lucide-react";

export default function BalanceManager({ onlineBalance, cashBalance, externalShowManager, setExternalShowManager }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
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
      showError("Please enter at least one adjustment amount");
      return;
    }

    if (!adjustments.reason.trim()) {
      showError("Please provide a reason for the adjustment");
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

      const balanceDocRef = doc(db, "currentBalances", currentUser.uid);
      const balanceDoc = await getDoc(balanceDocRef);
      
      let newOnlineBalance, newCashBalance;
      
      if (balanceDoc.exists()) {
        const currentData = balanceDoc.data();
        newOnlineBalance = currentData.online + (parseFloat(adjustments.online) || 0);
        newCashBalance = currentData.cash + (parseFloat(adjustments.cash) || 0);
        
        await updateDoc(balanceDocRef, {
          online: newOnlineBalance,
          cash: newCashBalance,
          lastUpdated: new Date(),
          updatedBy: currentUser.uid,
          reason: `Balance adjustment: ${adjustments.reason}`,
        });
      } else {
        newOnlineBalance = parseFloat(adjustments.online) || 0;
        newCashBalance = parseFloat(adjustments.cash) || 0;
        
        await setDoc(balanceDocRef, {
          online: newOnlineBalance,
          cash: newCashBalance,
          lastUpdated: new Date(),
          updatedBy: currentUser.uid,
          reason: `Initial balance adjustment: ${adjustments.reason}`,
        });
      }

      await sendBalanceAdjustmentAlert(currentUser.email, {
        reason: adjustments.reason,
        onlineAdjustment: parseFloat(adjustments.online) || 0,
        cashAdjustment: parseFloat(adjustments.cash) || 0,
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
        `Balance adjusted successfully! Total change: ₹${totalAdjustment.toFixed(
          2
        )}`
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
      <div
        onClick={() => setManagerOpen(true)}
        className="hidden lg:flex btn-secondary items-center space-x-2 cursor-pointer"
        role="button"
        tabIndex={0}
      >
        <Settings className="h-4 w-4" />
        <span>Adjust</span>
      </div>

      {isManagerOpen && (
        <div 
          className="fixed inset-0 bg-[var(--primary-900)]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-scale"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setManagerOpen(false);
            }
          }}
        >
          <div 
            className="statement-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--hairline)] mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-[var(--navy)] text-white flex items-center justify-center font-mono text-sm">
                  S
                </div>
                <div>
                  <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Wallet Calibration</div>
                  <h2 className="text-xl font-semibold text-[var(--navy)]">Balance Manager</h2>
                </div>
              </div>
              <button
                onClick={() => setManagerOpen(false)}
                className="btn-statement p-1.5 rounded-md hover:border-[var(--rose)] hover:text-[var(--rose)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="passbook-card p-4">
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Online Account</div>
                  <div className="font-mono text-2xl font-semibold text-[var(--navy)] mt-1 tabular-nums">
                    ₹{onlineBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="passbook-card p-4">
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Cash in Hand</div>
                  <div className="font-mono text-2xl font-semibold text-[var(--navy)] mt-1 tabular-nums">
                    ₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Adjustment Form */}
              <form onSubmit={handleAdjustment} className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--navy)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Calibrate Amounts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-premium">Online Adjustment</label>
                      <input
                        type="number"
                        name="online"
                        value={adjustments.online}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="+/- 0.00"
                        className="input-premium font-mono text-xs"
                      />
                      <p className="text-[10px] text-[var(--slate-light)] mt-1">Positive to add, negative to deduct</p>
                    </div>
                    <div>
                      <label className="label-premium">Cash Adjustment</label>
                      <input
                        type="number"
                        name="cash"
                        value={adjustments.cash}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="+/- 0.00"
                        className="input-premium font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-premium">Reason *</label>
                  <input
                    type="text"
                    name="reason"
                    value={adjustments.reason}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Correction, Found cash, Bank interest"
                    className="input-premium text-xs"
                  />
                </div>

                {/* Preview Section */}
                {(adjustments.online || adjustments.cash) && (
                  <div className="passbook-card p-4 bg-[var(--white)]">
                    <div className="text-[10px] uppercase tracking-[1.5px] text-[var(--slate-light)] font-semibold mb-2">Projected Result</div>
                    <div className="space-y-1.5 text-xs font-mono">
                      {adjustments.online && (
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--slate)]">Online:</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-[var(--slate-light)]">₹{onlineBalance.toFixed(2)}</span>
                            <span>→</span>
                            <span className="font-semibold text-[var(--navy)]">
                              ₹{(onlineBalance + (parseFloat(adjustments.online) || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                      {adjustments.cash && (
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--slate)]">Cash:</span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-[var(--slate-light)]">₹{cashBalance.toFixed(2)}</span>
                            <span>→</span>
                            <span className="font-semibold text-[var(--navy)]">
                              ₹{(cashBalance + (parseFloat(adjustments.cash) || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setManagerOpen(false)}
                    className="btn-statement text-[10px] py-2.5 px-4 flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-statement-primary text-[10px] py-2.5 px-4 flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Confirm Adjustment
                  </button>
                </div>
              </form>

              {/* History */}
              {recentAdjustments.length > 0 && (
                <div className="pt-6 border-t border-[var(--hairline)]">
                  <h3 className="text-xs font-semibold text-[var(--navy)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Recent Calibrations
                  </h3>
                  <div className="space-y-2">
                    {recentAdjustments.map((adj) => (
                      <div key={adj.id} className="ledger-row p-2 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-medium text-[var(--navy)]">{adj.reason}</p>
                          <p className="text-[10px] font-mono text-[var(--slate-light)]">{new Date(adj.createdAt.toDate()).toLocaleDateString()}</p>
                        </div>
                        <div className="font-mono text-xs text-right">
                          {adj.onlineAdjustment !== 0 && (
                            <div className={adj.onlineAdjustment > 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}>
                              Onl: {adj.onlineAdjustment > 0 ? '+' : ''}{adj.onlineAdjustment}
                            </div>
                          )}
                          {adj.cashAdjustment !== 0 && (
                            <div className={adj.cashAdjustment > 0 ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}>
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
        </div>
      )}
    </>
  );
}
