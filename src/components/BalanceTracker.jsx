import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const BalanceTracker = ({ 
  currentBalances, 
  transactionOnlineBalance, 
  transactionCashBalance, 
  onBalanceUpdate 
}) => {
  const { currentUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
      <div className="py-3 px-4 flex items-center justify-between border border-[var(--line)] rounded-[6px] bg-[var(--surface)] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--credit)]"></div>
          <span className="font-medium text-[var(--ink)]">
            Wallets in sync
          </span>
        </div>
        <span className="text-[var(--ink-3)] tabular-nums">
          Online: ₹{(currentBalances?.online || 0).toLocaleString('en-IN')} · Cash: ₹{(currentBalances?.cash || 0).toLocaleString('en-IN')}
        </span>
      </div>
    );
  }

  return (
    <div className="border border-[var(--line)] rounded-[6px] bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-start justify-between pb-2 border-b border-[var(--line)]">
        <div>
          <span className="text-xs text-[var(--ink-3)]">Wallet status</span>
          <h3 className="text-sm font-semibold text-[var(--ink)] mt-0.5">Balance discrepancy detected</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
        >
          {showDetails ? 'Hide details' : 'View breakdown'}
        </button>
      </div>

      <p className="text-xs text-[var(--ink-2)] leading-relaxed">
        Your current recorded wallet balance differs from calculated transaction totals.
      </p>

      {showDetails && (
        <div className="p-3 bg-[var(--sunken)] rounded-[6px] border border-[var(--line)] space-y-1.5 text-xs tabular-nums">
          <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
            <span className="text-[var(--ink-3)]">Current online:</span>
            <span className="text-[var(--ink)] font-medium">₹{(currentBalances?.online || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
            <span className="text-[var(--ink-3)]">Transaction online:</span>
            <span className="text-[var(--ink)] font-medium">₹{transactionOnlineBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
            <span className="text-[var(--ink-3)]">Current cash:</span>
            <span className="text-[var(--ink)] font-medium">₹{(currentBalances?.cash || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-[var(--ink-3)]">Transaction cash:</span>
            <span className="text-[var(--ink)] font-medium">₹{transactionCashBalance.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={syncToCurrentBalance}
          disabled={syncing}
          className="btn-secondary text-xs flex-1"
        >
          Keep current balance
        </button>
        <button
          onClick={syncToTransactionBalance}
          disabled={syncing}
          className="btn-primary text-xs flex-1"
        >
          Sync to transactions
        </button>
      </div>
    </div>
  );
};

export default BalanceTracker;
