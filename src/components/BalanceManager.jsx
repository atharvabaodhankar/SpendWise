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
import { Settings, Edit3, Save, X, History, TrendingUp, TrendingDown, RefreshCw, CreditCard, Wallet } from "lucide-react";

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
            className="premium-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-primary)] sticky top-0 z-10">
               <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--primary-50)] rounded-lg">
                     <Settings className="w-5 h-5 text-[var(--primary-600)]" />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-[var(--text-primary)]">Balance Manager</h2>
                     <p className="text-sm text-[var(--text-secondary)]">Calibrate your accounts manually</p>
                  </div>
               </div>
               <button
                  onClick={() => setManagerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--text-secondary)] hover:bg-[var(--primary-100)] transition-colors"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Current Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                       <div>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Online Account</p>
                          <h3 className={`text-xl font-bold mt-1 ${onlineBalance >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger-600)]'}`}>
                             ₹{onlineBalance.toFixed(2)}
                          </h3>
                       </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/3 translate-x-1/4">
                       <CreditCard className="w-24 h-24 text-[var(--text-primary)]" />
                    </div>
                 </div>

                 <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 relative">
                       <div>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Cash in Hand</p>
                          <h3 className={`text-xl font-bold mt-1 ${cashBalance >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger-600)]'}`}>
                             ₹{cashBalance.toFixed(2)}
                          </h3>
                       </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/3 translate-x-1/4">
                       <Wallet className="w-24 h-24 text-[var(--text-primary)]" />
                    </div>
                 </div>
              </div>

              {/* Adjustment Form */}
              <form onSubmit={handleAdjustment} className="space-y-6">
                 <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center">
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Make Adjustment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div>
                          <label className="label-premium">Online Amount</label>
                          <input
                             type="number"
                             name="online"
                             value={adjustments.online}
                             onChange={handleChange}
                             step="0.01"
                             placeholder="+/- 0.00"
                             className="input-premium"
                          />
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Positive to add, negative to deduct</p>
                       </div>
                       <div>
                          <label className="label-premium">Cash Amount</label>
                          <input
                             type="number"
                             name="cash"
                             value={adjustments.cash}
                             onChange={handleChange}
                             step="0.01"
                             placeholder="+/- 0.00"
                             className="input-premium"
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
                       className="input-premium"
                    />
                 </div>

                 {/* Preview Section */}
                 {(adjustments.online || adjustments.cash) && (
                    <div className="p-4 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-200)] animate-slide-up">
                       <h4 className="text-xs font-bold text-[var(--primary-700)] uppercase mb-3">Projected Balances</h4>
                       <div className="space-y-2 text-sm">
                          {adjustments.online && (
                             <div className="flex justify-between items-center">
                                <span className="text-[var(--text-secondary)]">Online:</span>
                                <div className="flex items-center gap-2">
                                   <span className="line-through text-[var(--text-tertiary)]">₹{onlineBalance.toFixed(2)}</span>
                                   <span>→</span>
                                   <span className="font-bold text-[var(--primary-700)]">
                                      ₹{(onlineBalance + (parseFloat(adjustments.online) || 0)).toFixed(2)}
                                   </span>
                                </div>
                             </div>
                          )}
                          {adjustments.cash && (
                             <div className="flex justify-between items-center">
                                <span className="text-[var(--text-secondary)]">Cash:</span>
                                <div className="flex items-center gap-2">
                                   <span className="line-through text-[var(--text-tertiary)]">₹{cashBalance.toFixed(2)}</span>
                                   <span>→</span>
                                   <span className="font-bold text-[var(--primary-700)]">
                                      ₹{(cashBalance + (parseFloat(adjustments.cash) || 0)).toFixed(2)}
                                   </span>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                 <div className="flex gap-4 pt-2">
                    <button
                       type="button"
                       onClick={() => setManagerOpen(false)}
                       className="flex-1 btn-secondary"
                    >
                       Cancel
                    </button>
                    <button
                       type="submit"
                       disabled={loading}
                       className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                       {loading ? <span className="animate-spin">↻</span> : <Save className="w-4 h-4" />}
                       Confirm Adjustment
                    </button>
                 </div>
              </form>

              {/* History */}
              {recentAdjustments.length > 0 && (
                <div className="pt-6 border-t border-[var(--card-border)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center">
                     <History className="w-4 h-4 mr-2" />
                     Recent History
                  </h3>
                  <div className="space-y-3">
                     {recentAdjustments.map((adj) => (
                        <div key={adj.id} className="text-sm p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)] flex justify-between items-center">
                           <div>
                              <p className="font-medium text-[var(--text-primary)]">{adj.reason}</p>
                              <p className="text-xs text-[var(--text-tertiary)]">{new Date(adj.createdAt.toDate()).toLocaleDateString()}</p>
                           </div>
                           <div className="text-right">
                              {adj.onlineAdjustment !== 0 && (
                                 <div className={`text-xs ${adj.onlineAdjustment > 0 ? 'text-[var(--success-600)]' : 'text-[var(--text-secondary)]'}`}>
                                    Onl: {adj.onlineAdjustment > 0 ? '+' : ''}{adj.onlineAdjustment}
                                 </div>
                              )}
                              {adj.cashAdjustment !== 0 && (
                                 <div className={`text-xs ${adj.cashAdjustment > 0 ? 'text-[var(--success-600)]' : 'text-[var(--text-secondary)]'}`}>
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
