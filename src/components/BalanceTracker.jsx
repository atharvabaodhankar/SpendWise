import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function BalanceTracker({ transactions }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [currentBalances, setCurrentBalances] = useState({
    online: 0,
    cash: 0,
    lastUpdated: null
  });
  const [showTracker, setShowTracker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load current balances from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const loadCurrentBalances = async () => {
      try {
        const balanceDoc = await getDoc(doc(db, 'currentBalances', currentUser.uid));
        if (balanceDoc.exists()) {
          setCurrentBalances(balanceDoc.data());
        }
      } catch (error) {
        console.error('Error loading current balances:', error);
      }
    };

    loadCurrentBalances();
  }, [currentUser]);

  // Calculate transaction-based balances (for comparison)
  const calculateTransactionBalances = () => {
    const onlineIncome = transactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'online')
      .reduce((sum, t) => sum + t.amount, 0);

    const onlineExpenses = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'online')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashIncome = transactions
      .filter(t => t.type === 'income' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashExpenses = transactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      online: onlineIncome - onlineExpenses,
      cash: cashIncome - cashExpenses
    };
  };

  const transactionBalances = calculateTransactionBalances();
  const hasDiscrepancy = Math.abs(currentBalances.online - transactionBalances.online) > 0.01 || 
                        Math.abs(currentBalances.cash - transactionBalances.cash) > 0.01;

  const updateCurrentBalances = async (newOnlineBalance, newCashBalance, reason) => {
    setLoading(true);
    try {
      const balanceData = {
        online: newOnlineBalance,
        cash: newCashBalance,
        lastUpdated: new Date(),
        updatedBy: currentUser.uid,
        reason: reason
      };

      await setDoc(doc(db, 'currentBalances', currentUser.uid), balanceData);
      setCurrentBalances(balanceData);
      
      showSuccess('Current balances updated successfully!');
      setShowTracker(false);
    } catch (error) {
      console.error('Error updating current balances:', error);
      showError('Failed to update balances. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const syncWithTransactions = () => {
    updateCurrentBalances(
      transactionBalances.online,
      transactionBalances.cash,
      'Synced with transaction history'
    );
  };

  return (
    <>
      {hasDiscrepancy && (
        <div className="mb-6 premium-card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Balance Discrepancy Detected</h3>
                <p className="text-sm text-amber-700 mb-3">
                  Your current balances don't match your transaction history. This usually happens when you add historical transactions.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <p className="font-medium text-amber-800">Current Balances:</p>
                    <p>Online: ₹{currentBalances.online.toFixed(2)}</p>
                    <p>Cash: ₹{currentBalances.cash.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Transaction-based:</p>
                    <p>Online: ₹{transactionBalances.online.toFixed(2)}</p>
                    <p>Cash: ₹{transactionBalances.cash.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowTracker(true)}
                    className="text-xs bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Update Current Balance
                  </button>
                  <button
                    onClick={syncWithTransactions}
                    className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-md hover:bg-amber-200 transition-colors"
                  >
                    Sync with Transactions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTracker && (
        <BalanceUpdateModal
          currentBalances={currentBalances}
          transactionBalances={transactionBalances}
          onUpdate={updateCurrentBalances}
          onClose={() => setShowTracker(false)}
          loading={loading}
        />
      )}
    </>
  );
}

function BalanceUpdateModal({ currentBalances, transactionBalances, onUpdate, onClose, loading }) {
  const [newBalances, setNewBalances] = useState({
    online: currentBalances.online,
    cash: currentBalances.cash,
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newBalances.reason.trim()) {
      alert('Please provide a reason for the balance update');
      return;
    }
    onUpdate(
      parseFloat(newBalances.online),
      parseFloat(newBalances.cash),
      newBalances.reason
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-scale">
      <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update Current Balance</h2>
                <p className="text-sm text-gray-500">Set your actual current balance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Balance Comparison</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium text-gray-600">Current (Actual)</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>💳 Online:</span>
                    <span className="font-semibold">₹{currentBalances.online.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💵 Cash:</span>
                    <span className="font-semibold">₹{currentBalances.cash.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-600">Transaction-based</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>💳 Online:</span>
                    <span className="font-semibold">₹{transactionBalances.online.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💵 Cash:</span>
                    <span className="font-semibold">₹{transactionBalances.cash.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Online Balance (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalances.online}
                  onChange={(e) => setNewBalances(prev => ({ ...prev, online: e.target.value }))}
                  className="premium-input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Cash Balance (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalances.cash}
                  onChange={(e) => setNewBalances(prev => ({ ...prev, cash: e.target.value }))}
                  className="premium-input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Update *
              </label>
              <input
                type="text"
                value={newBalances.reason}
                onChange={(e) => setNewBalances(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Checked actual bank balance, Counted physical cash"
                className="premium-input w-full"
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Understanding Balance Tracking</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Current Balance:</strong> Your actual money right now</p>
                <p>• <strong>Transaction-based:</strong> Calculated from all your recorded transactions</p>
                <p>• <strong>Discrepancy:</strong> Happens when you add historical transactions or miss some transactions</p>
                <p>• <strong>Solution:</strong> Update current balance to match your actual money, keep adding transactions going forward</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-3 font-semibold disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Current Balance'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}