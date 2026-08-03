import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { Wallet, CreditCard, Banknote, ArrowRight, Lightbulb } from "lucide-react";

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
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "currentBalances", currentUser.uid), balanceData);
      showSuccess("Initial balances set up successfully!");
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error setting initial balances:", err);
      showError("Failed to set initial balances");
    }

    setLoading(false);
  };

  const handleSkip = async () => {
    try {
      const balanceData = {
        online: 0,
        cash: 0,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "currentBalances", currentUser.uid), balanceData);
      showSuccess("Started with ₹0.00 balances!");
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error skipping setup:", err);
      showError("Failed to skip setup");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="statement-card w-full max-w-xl my-auto p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--navy)] text-white font-mono text-xl font-bold rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
            S
          </div>
          <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Account Setup</div>
          <h1 className="text-2xl font-semibold text-[var(--navy)] tracking-tight mt-1">
            Welcome to SpendWise
          </h1>
          <p className="text-xs text-[var(--slate)] mt-1">
            Set up your initial account balances to begin expense tracking
          </p>
        </div>

        {/* Explanation Card */}
        <div className="passbook-card p-5 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--navy)] uppercase tracking-wider mb-2">
            <Lightbulb className="w-4 h-4 text-[var(--navy)]" />
            <span>Why set initial balances?</span>
          </div>
          <div className="text-[11px] text-[var(--slate)] space-y-1.5 leading-relaxed">
            <p>• <strong>Real-time Accuracy:</strong> Passbook tracks current wallet totals alongside transaction ledgers.</p>
            <p>• <strong>Independent Adjustments:</strong> Add past transactions without disrupting your current balance state.</p>
            <p>• <strong>Smart Auditing:</strong> Get automated alerts if ledger outlays deviate from tracked funds.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Online Balance */}
            <div>
              <label className="label-premium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[var(--slate-light)]" />
                Online / Bank Balance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balances.online}
                onChange={(e) =>
                  setBalances((prev) => ({ ...prev, online: e.target.value }))
                }
                placeholder="0.00"
                className="input-premium font-mono text-sm"
              />
              <p className="text-[10px] text-[var(--slate-light)] mt-1">
                Bank accounts, UPI, digital wallets
              </p>
            </div>

            {/* Cash Balance */}
            <div>
              <label className="label-premium flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-[var(--slate-light)]" />
                Cash Balance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balances.cash}
                onChange={(e) =>
                  setBalances((prev) => ({ ...prev, cash: e.target.value }))
                }
                placeholder="0.00"
                className="input-premium font-mono text-sm"
              />
              <p className="text-[10px] text-[var(--slate-light)] mt-1">
                Physical cash in wallet or home
              </p>
            </div>
          </div>

          {/* Total Preview */}
          {(balances.online || balances.cash) && (
            <div className="statement-card p-4 border border-[var(--emerald)]/30 bg-[var(--white)]">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[1.5px] text-[var(--slate-light)] font-semibold mb-1">
                  Calculated Starting Total
                </div>
                <div className="font-mono text-2xl font-bold text-[var(--navy)] tabular-nums">
                  ₹{(
                    (parseFloat(balances.online) || 0) +
                    (parseFloat(balances.cash) || 0)
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || (!balances.online && !balances.cash)}
              className="flex-1 btn-statement-primary text-[10px] py-3.5 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Setting up..." : "Set Passbook Balances"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="btn-statement text-[10px] py-3.5"
            >
              Start with ₹0.00
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
