import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, RefreshCw, DollarSign, Wallet, TrendingUp, Info } from 'lucide-react';

const BalanceTracker = ({ 
  currentBalances, 
  transactionOnlineBalance, 
  transactionCashBalance,
  onBalanceUpdate 
}) => {
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check for discrepancies (allow small rounding differences)
  const onlineDiscrepancy = Math.abs((currentBalances?.online || 0) - transactionOnlineBalance) > 0.01;
  const cashDiscrepancy = Math.abs((currentBalances?.cash || 0) - transactionCashBalance) > 0.01;
  const hasDiscrepancy = onlineDiscrepancy || cashDiscrepancy;

  const syncToTransactionBalance = async () => {
    if (!currentUser) return;
    
    setSyncing(true);
    try {
      const newBalances = {
        online: transactionOnlineBalance,
        cash: transactionCashBalance,
        lastUpdated: serverTimestamp(),
        updatedBy: 'sync_to_transactions'
      };

      await setDoc(doc(db, 'currentBalances', currentUser.uid), newBalances);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(newBalances);
      }
    } catch (error) {
      console.error('Error syncing balances:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncToCurrentBalance = async () => {
    if (!currentUser || !currentBalances) return;
    
    setSyncing(true);
    try {
      // This would require updating all transactions to match current balance
      // For now, we'll just update the timestamp to acknowledge the current balance is correct
      const updatedBalances = {
        ...currentBalances,
        lastUpdated: serverTimestamp(),
        updatedBy: 'sync_to_current'
      };

      await setDoc(doc(db, 'currentBalances', currentUser.uid), updatedBalances);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(updatedBalances);
      }
    } catch (error) {
      console.error('Error updating balances:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!hasDiscrepancy) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Balances in Sync</h3>
            <p className="text-sm text-green-600">Your current and transaction balances match perfectly!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-800">Balance Discrepancy Detected</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-amber-700 mb-4">
            Your current balance doesn't match your transaction history. This usually happens when:
          </p>
          
          <ul className="text-sm text-amber-700 mb-4 space-y-1">
            <li>• You added historical transactions</li>
            <li>• You made transactions outside the app</li>
            <li>• You started tracking mid-way through your spending</li>
          </ul>

          {showDetails && (
            <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-3">Balance Comparison:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-700">Online Balance</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">₹{(currentBalances?.online || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">From Transactions:</span>
                      <span className="font-medium">₹{transactionOnlineBalance.toFixed(2)}</span>
                    </div>
                    {onlineDiscrepancy && (
                      <div className="flex justify-between text-sm font-medium text-amber-600">
                        <span>Difference:</span>
                        <span>₹{Math.abs((currentBalances?.online || 0) - transactionOnlineBalance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-700">Cash Balance</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">₹{(currentBalances?.cash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">From Transactions:</span>
                      <span className="font-medium">₹{transactionCashBalance.toFixed(2)}</span>
                    </div>
                    {cashDiscrepancy && (
                      <div className="flex justify-between text-sm font-medium text-amber-600">
                        <span>Difference:</span>
                        <span>₹{Math.abs((currentBalances?.cash || 0) - transactionCashBalance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={syncToCurrentBalance}
              disabled={syncing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              Keep Current Balance
            </button>
            
            <button
              onClick={syncToTransactionBalance}
              disabled={syncing}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Use Transaction Balance
            </button>
          </div>
          
          <div className="mt-3 text-xs text-amber-600">
            <strong>Tip:</strong> Choose "Keep Current Balance" if your current balance is accurate. 
            Choose "Use Transaction Balance" if all your transactions are recorded correctly.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceTracker;