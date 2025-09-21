import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { Wallet, CreditCard, ArrowRight } from "lucide-react";

export default function InitialBalanceSetup({ onComplete }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [balances, setBalances] = useState({
    online: "",
    cash: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!balances.online && !balances.cash) {
      showError("Please enter at least one balance amount");
      return;
    }

    setLoading(true);

    try {
      const balanceData = {
        online: parseFloat(balances.online) || 0,
        cash: parseFloat(balances.cash) || 0,
        lastUpdated: new Date(),
        updatedBy: currentUser.uid,
        reason: "Initial balance setup",
      };

      await setDoc(doc(db, "currentBalances", currentUser.uid), balanceData);

      showSuccess(
        "Initial balances set successfully! You can now start tracking your finances."
      );
      onComplete();
    } catch (error) {
      console.error("Error setting initial balances:", error);
      showError("Failed to set initial balances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Set zero balances
    const balanceData = {
      online: 0,
      cash: 0,
      lastUpdated: new Date(),
      updatedBy: currentUser.uid,
      reason: "Skipped initial setup - starting from zero",
    };

    setDoc(doc(db, "currentBalances", currentUser.uid), balanceData)
      .then(() => {
        showSuccess(
          "Starting with zero balances. You can update them anytime using the Balance Manager."
        );
        onComplete();
      })
      .catch((error) => {
        console.error("Error setting zero balances:", error);
        showError("Failed to initialize. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-8 px-4">
      <div className="premium-card w-full max-w-2xl animate-fade-scale my-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden">
              <img 
                src="/logo.png" 
                alt="SpendWise Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to SpendWise!
            </h1>
            <p className="text-lg text-gray-600">
              Let's set up your current balances to get started
            </p>
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💡 Why do we need your current balances?
            </h3>
            <div className="text-blue-700 space-y-2 text-sm">
              <p>
                • <strong>Accurate Tracking:</strong> We track your actual
                current money, not just transaction history
              </p>
              <p>
                • <strong>Historical Transactions:</strong> You can add past
                transactions without affecting your current balance
              </p>
              <p>
                • <strong>Real Balance:</strong> Always shows how much money you
                actually have right now
              </p>
              <p>
                • <strong>Smart Alerts:</strong> We'll warn you if your balances
                don't match your transaction history
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Online Balance */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Online Balance
                    </h3>
                    <p className="text-sm text-gray-500">
                      Bank accounts, UPI, digital wallets
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balances.online}
                  onChange={(e) =>
                    setBalances((prev) => ({ ...prev, online: e.target.value }))
                  }
                  placeholder="Enter your current online balance"
                  className="premium-input w-full text-lg"
                />
                <p className="text-xs text-gray-500">
                  Check your bank app, UPI balance, etc.
                </p>
              </div>

              {/* Cash Balance */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cash Balance
                    </h3>
                    <p className="text-sm text-gray-500">
                      Physical cash in wallet, home
                    </p>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balances.cash}
                  onChange={(e) =>
                    setBalances((prev) => ({ ...prev, cash: e.target.value }))
                  }
                  placeholder="Enter your current cash balance"
                  className="premium-input w-full text-lg"
                />
                <p className="text-xs text-gray-500">
                  Count the cash in your wallet and at home
                </p>
              </div>
            </div>

            {/* Total Preview */}
            {(balances.online || balances.cash) && (
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-600 mb-2">
                    Your Total Balance
                  </p>
                  <p className="text-4xl font-bold text-emerald-700">
                    ₹
                    {(
                      (parseFloat(balances.online) || 0) +
                      (parseFloat(balances.cash) || 0)
                    ).toFixed(2)}
                  </p>
                  <div className="flex justify-center space-x-6 mt-3 text-sm text-emerald-600">
                    <span>
                      Online: ₹{(parseFloat(balances.online) || 0).toFixed(2)}
                    </span>
                    <span>•</span>
                    <span>
                      Cash: ₹{(parseFloat(balances.cash) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || (!balances.online && !balances.cash)}
                className="flex-1 btn-primary py-4 text-lg font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? "Setting up..." : "Set My Balances"}</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 btn-secondary py-4 text-lg font-semibold"
              >
                Start with ₹0.00
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Don't worry, you can always update these balances later using the
              Balance Manager
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
