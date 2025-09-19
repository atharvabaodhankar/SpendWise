import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { Settings, Edit3, Save, X } from "lucide-react";

export default function BalanceManager({ onlineBalance, cashBalance }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showManager, setShowManager] = useState(false);
  const [adjustments, setAdjustments] = useState({
    online: "",
    cash: "",
    reason: "",
  });
  const [recentAdjustments, setRecentAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !showManager) return;

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
  }, [currentUser, showManager]);

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

      // Add online adjustment transaction if specified
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

      // Add cash adjustment transaction if specified
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

      // Record the adjustment for history
      await addDoc(collection(db, "balanceAdjustments"), adjustmentData);

      setAdjustments({ online: "", cash: "", reason: "" });
      setShowManager(false);

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
      <button
        onClick={() => setShowManager(true)}
        className="bg-gradient-to-r from-slate-500 to-gray-600 text-white px-6 py-4 rounded-xl hover:from-slate-600 hover:to-gray-700 flex items-center space-x-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        title="Adjust Balances"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Adjust Balances</span>
        <span className="sm:hidden">Adjust</span>
      </button>

      {showManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 animate-fade-scale overflow-y-auto">
          <div className="premium-card w-full max-w-2xl my-4 sm:my-0 sm:max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Balance Manager
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Adjust your online and cash balances
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManager(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 self-end sm:self-auto"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* Current Balances */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Current Balances
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex justify-between sm:flex-col sm:items-start">
                    <span className="text-sm">💳 Online:</span>
                    <span
                      className={`text-sm sm:text-base font-medium ${
                        onlineBalance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{onlineBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:items-start">
                    <span className="text-sm">💵 Cash:</span>
                    <span
                      className={`text-sm sm:text-base font-medium ${
                        cashBalance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{cashBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAdjustment} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💳 Online Adjustment (₹)
                    </label>
                    <input
                      type="number"
                      name="online"
                      value={adjustments.online}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      + Add / - Remove money
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💵 Cash Adjustment (₹)
                    </label>
                    <input
                      type="number"
                      name="cash"
                      value={adjustments.cash}
                      onChange={handleChange}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      + Add / - Remove money
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Adjustment *
                  </label>
                  <input
                    type="text"
                    name="reason"
                    value={adjustments.reason}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Initial balance setup, Found cash, Bank error correction"
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                  />
                </div>

                {/* Preview */}
                {(adjustments.online || adjustments.cash) && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">
                      Preview Changes:
                    </h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      {adjustments.online && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                          <span className="font-medium">💳 Online:</span>
                          <div className="flex items-center space-x-2">
                            <span>₹{onlineBalance.toFixed(2)}</span>
                            <span>→</span>
                            <span className="font-semibold">
                              ₹
                              {(
                                onlineBalance +
                                (parseFloat(adjustments.online) || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                      {adjustments.cash && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                          <span className="font-medium">💵 Cash:</span>
                          <div className="flex items-center space-x-2">
                            <span>₹{cashBalance.toFixed(2)}</span>
                            <span>→</span>
                            <span className="font-semibold">
                              ₹
                              {(
                                cashBalance + (parseFloat(adjustments.cash) || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:flex-1 bg-blue-600 text-white py-3 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? "Adjusting..." : "Apply Adjustment"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManager(false)}
                    className="w-full sm:flex-1 bg-gray-200 text-gray-700 py-3 sm:py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Recent Adjustments */}
              {recentAdjustments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Recent Adjustments
                  </h3>
                  <div className="space-y-2 max-h-40 sm:max-h-32 overflow-y-auto">
                    {recentAdjustments.map((adj) => (
                      <div
                        key={adj.id}
                        className="text-xs sm:text-xs p-3 sm:p-2 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-1 sm:space-y-0">
                          <span className="font-medium text-gray-800 pr-2">{adj.reason}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(
                              adj.createdAt.toDate()
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-2 sm:mt-1 flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                          {adj.onlineAdjustment !== 0 && (
                            <span className="flex items-center">
                              <span className="mr-1">💳</span>
                              {adj.onlineAdjustment > 0 ? "+" : ""}₹
                              {adj.onlineAdjustment.toFixed(2)}
                            </span>
                          )}
                          {adj.cashAdjustment !== 0 && (
                            <span className="flex items-center">
                              <span className="mr-1">💵</span>
                              {adj.cashAdjustment > 0 ? "+" : ""}₹
                              {adj.cashAdjustment.toFixed(2)}
                            </span>
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
