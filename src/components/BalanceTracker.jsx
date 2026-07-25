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
      <div className="passbook-card py-4 px-6 flex items-center justify-between border border-[var(--hairline)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--emerald)]"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--slate)] font-sans">
            Wallets in sync
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--slate-light)]">
          Online: ₹{(currentBalances?.online || 0).toLocaleString('en-IN')} | Cash: ₹{(currentBalances?.cash || 0).toLocaleString('en-IN')}
        </span>
      </div>
    );
  }

  return (
    <div className="passbook-card border border-[var(--hairline)]">
      <div className="flex items-start justify-between pb-3 border-b border-[var(--hairline)] mb-4">
        <div>
          <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Wallet Status</div>
          <h3 className="text-base font-semibold text-[var(--navy)] mt-0.5">Balance Discrepancy Detected</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[var(--slate-light)] hover:text-[var(--navy)] transition-colors font-mono"
        >
          {showDetails ? 'Hide details' : 'View breakdown'}
        </button>
      </div>

      <p className="text-xs text-[var(--slate)] mb-4 leading-relaxed">
        Your current recorded wallet balance differs from calculated transaction totals.
      </p>

      {showDetails && (
        <div className="p-4 bg-[var(--canvas)] rounded-md border border-[var(--hairline)] mb-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between py-1 border-b border-dashed border-[var(--hairline)]">
            <span className="text-[var(--slate)]">Current Online:</span>
            <span className="text-[var(--navy)] font-semibold">₹{(currentBalances?.online || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-[var(--hairline)]">
            <span className="text-[var(--slate)]">Transaction Online:</span>
            <span className="text-[var(--navy)] font-semibold">₹{transactionOnlineBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-[var(--hairline)]">
            <span className="text-[var(--slate)]">Current Cash:</span>
            <span className="text-[var(--navy)] font-semibold">₹{(currentBalances?.cash || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--slate)]">Transaction Cash:</span>
            <span className="text-[var(--navy)] font-semibold">₹{transactionCashBalance.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={syncToCurrentBalance}
          disabled={syncing}
          className="btn-statement text-[10px] flex-1"
        >
          Keep Current Balance
        </button>
        <button
          onClick={syncToTransactionBalance}
          disabled={syncing}
          className="btn-statement-primary text-[10px] flex-1"
        >
          Sync To Transactions
        </button>
      </div>
    </div>
  );
};
};

export default BalanceTracker;