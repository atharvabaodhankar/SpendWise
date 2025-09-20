import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Settings, Edit3, Save, X } from 'lucide-react';

export default function BalanceManager({ onlineBalance, cashBalance }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showManager, setShowManager] = useState(false);
  const [adjustments, setAdjustments] = useState({
    online: '',
    cash: '',
    reason: ''
  });
  const [recentAdjustments, setRecentAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !showManager) return;

    const q = query(
      collection(db, 'balanceAdjustments'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
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
      showError('Please enter at least one adjustment amount');
      return;
    }

    if (!adjustments.reason.trim()) {
      showError('Please provide a reason for the adjustment');
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
        date: new Date().toISOString().split('T')[0]
      };

      // Add online adjustment transaction if specified
      if (adjustments.online) {
        const onlineAmount = parseFloat(adjustments.online);
        await addDoc(collection(db, 'transactions'), {
          type: onlineAmount > 0 ? 'income' : 'expense',
          amount: Math.abs(onlineAmount),
          category: 'Balance Adjustment',
          description: `Online balance adjustment: ${adjustments.reason}`,
          paymentMethod: 'online',
          date: new Date().toISOString().split('T')[0],
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true
        });
      }

      // Add cash adjustment transaction if specified
      if (adjustments.cash) {
        const cashAmount = parseFloat(adjustments.cash);
        await addDoc(collection(db, 'transactions'), {
          type: cashAmount > 0 ? 'income' : 'expense',
          amount: Math.abs(cashAmount),
          category: 'Balance Adjustment',
          description: `Cash balance adjustment: ${adjustments.reason}`,
          paymentMethod: 'cash',
          date: new Date().toISOString().split('T')[0],
          userId: currentUser.uid,
          createdAt: new Date(),
          isBalanceAdjustment: true
        });
      }

      // Record the adjustment for history
      await addDoc(collection(db, 'balanceAdjustments'), adjustmentData);

      setAdjustments({ online: '', cash: '', reason: '' });
      setShowManager(false);
      
      const totalAdjustment = (parseFloat(adjustments.online) || 0) + (parseFloat(adjustments.cash) || 0);
      showSuccess(`Balance adjusted successfully! Total change: ₹${totalAdjustment.toFixed(2)}`);
    } catch (error) {
      console.error('Error adjusting balance:', error);
      showError('Failed to adjust balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdjustments(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
        title="Adjust Balances"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Adjust Balances</span>
        <span className="sm:hidden">Adjust</span>
      </button>

      {showManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Edit3 className="h-5 w-5" />
                <span>Adjust Balances</span>
              </h2>
              <button
                onClick={() => setShowManager(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Current Balances */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Balances</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>💳 Online:</span>
                  <span className={onlineBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{onlineBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>💵 Cash:</span>
                  <span className={cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{cashBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Balance Adjustment (₹)
                </label>
                <input
                  type="number"
                  name="online"
                  value={adjustments.online}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="Enter positive or negative amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positive = Add money, Negative = Remove money
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Balance Adjustment (₹)
                </label>
                <input
                  type="number"
                  name="cash"
                  value={adjustments.cash}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="Enter positive or negative amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positive = Add money, Negative = Remove money
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  name="reason"
                  value={adjustments.reason}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Initial balance setup, Found cash, Bank error correction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              {(adjustments.online || adjustments.cash) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Preview Changes:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    {adjustments.online && (
                      <div className="flex justify-between">
                        <span>Online: ₹{onlineBalance.toFixed(2)} → </span>
                        <span className="font-medium">
                          ₹{(onlineBalance + (parseFloat(adjustments.online) || 0)).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {adjustments.cash && (
                      <div className="flex justify-between">
                        <span>Cash: ₹{cashBalance.toFixed(2)} → </span>
                        <span className="font-medium">
                          ₹{(cashBalance + (parseFloat(adjustments.cash) || 0)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Adjusting...' : 'Apply Adjustment'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManager(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Recent Adjustments */}
            {recentAdjustments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Adjustments</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentAdjustments.map((adj) => (
                    <div key={adj.id} className="text-xs p-2 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{adj.reason}</span>
                        <span className="text-gray-500">
                          {new Date(adj.createdAt.toDate()).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-gray-600 mt-1">
                        {adj.onlineAdjustment !== 0 && (
                          <span className="mr-3">
                            Online: {adj.onlineAdjustment > 0 ? '+' : ''}₹{adj.onlineAdjustment.toFixed(2)}
                          </span>
                        )}
                        {adj.cashAdjustment !== 0 && (
                          <span>
                            Cash: {adj.cashAdjustment > 0 ? '+' : ''}₹{adj.cashAdjustment.toFixed(2)}
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
      )}
    </>
  );
}