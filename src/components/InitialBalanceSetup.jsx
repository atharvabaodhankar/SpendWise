import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import SpendWiseLogo from "./SpendWiseLogo";
import Money from "./Money";

export default function InitialBalanceSetup({ onComplete }) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});

  const [balances, setBalances] = useState({
    online: "",
    cash: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!balances.online && !balances.cash) {
      showError("Please enter at least one balance amount.");
      return;
    }

    setLoading(true);

    try {
      const balanceData = {
        online: parseFloat(balances.online) || 0,
        cash: parseFloat(balances.cash) || 0,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser) {
        await setDoc(doc(db, "currentBalances", currentUser.uid), balanceData);
      }
      showSuccess("Initial balances saved.");
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error setting initial balances:", err);
      showError("Failed to save initial balances.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const balanceData = {
        online: 0,
        cash: 0,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser) {
        await setDoc(doc(db, "currentBalances", currentUser.uid), balanceData);
      }
      showSuccess("Started with zero balance.");
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error skipping setup:", err);
      showError("Failed to skip setup.");
    }
  };

  const totalCalculated =
    (parseFloat(balances.online) || 0) + (parseFloat(balances.cash) || 0);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Set starting balances"
    >
      <div className="w-full sm:max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[14px] shadow-[var(--shadow-pop)] p-6 sm:p-8 space-y-6 max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <SpendWiseLogo size={36} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">
            Set your starting balance
          </h1>
          <p className="text-xs text-[var(--ink-3)] max-w-sm mx-auto">
            Tell SpendWise how much you have across online and cash wallets right now.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Online Balance */}
            <div>
              <label className="field-label" htmlFor="initial-online">
                Online (bank / UPI)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm text-[var(--ink-3)]">₹</span>
                <input
                  id="initial-online"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={balances.online}
                  onChange={(e) =>
                    setBalances((prev) => ({ ...prev, online: e.target.value }))
                  }
                  placeholder="0.00"
                  className="field pl-7 text-sm"
                />
              </div>
            </div>

            {/* Cash Balance */}
            <div>
              <label className="field-label" htmlFor="initial-cash">
                Cash in hand
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm text-[var(--ink-3)]">₹</span>
                <input
                  id="initial-cash"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={balances.cash}
                  onChange={(e) =>
                    setBalances((prev) => ({ ...prev, cash: e.target.value }))
                  }
                  placeholder="0.00"
                  className="field pl-7 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Calculated Total */}
          {(balances.online || balances.cash) && (
            <div className="p-3 bg-[var(--sunken)] rounded-[6px] flex items-center justify-between text-xs">
              <span className="text-[var(--ink-3)]">Starting net balance:</span>
              <Money amount={totalCalculated} className="font-semibold text-[var(--ink)]" />
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="btn btn-quiet flex-1 text-xs order-2 sm:order-1"
            >
              Start with ₹0.00
            </button>
            <button
              type="submit"
              disabled={loading || (!balances.online && !balances.cash)}
              className="btn btn-primary flex-1 text-xs order-1 sm:order-2"
            >
              {loading ? "Saving..." : "Save balances"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
