import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TrendingUp, TrendingDown, CheckCircle, Clock, Check } from 'lucide-react';

export default function DebtList({ debts: propDebts, onSettle }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [youOwe, setYouOwe] = useState([]);
  const [owedToYou, setOwedToYou] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propDebts) {
      setYouOwe(
        propDebts
          .filter((d) => d.type === 'owe')
          .map((d) => ({ ...d, otherUserName: d.friendName || d.otherUserName || 'Friend' }))
      );
      setOwedToYou(
        propDebts
          .filter((d) => d.type !== 'owe')
          .map((d) => ({ ...d, otherUserName: d.friendName || d.otherUserName || 'Friend' }))
      );
      setLoading(false);
      return;
    }

    if (!currentUser) return;

    // Query 1: Debts where I am the debtor (I owe money)
    const q1 = query(
      collection(db, 'debts'),
      where('debtorId', '==', currentUser.uid),
      where('status', 'in', ['unpaid', 'pending_confirmation'])
    );

    // Query 2: Debts where I am the creditor (Someone owes me money)
    const q2 = query(
      collection(db, 'debts'),
      where('creditorId', '==', currentUser.uid),
      where('status', 'in', ['unpaid', 'pending_confirmation'])
    );

    const unsubscribe1 = onSnapshot(q1, async (snapshot) => {
      const debts = await Promise.all(snapshot.docs.map(async (d) => {
         const data = d.data();
         // Fetch creditor name
         let creditorName = 'Unknown';
         try {
            const userSnap = await getDoc(doc(db, 'users', data.creditorId));
            if (userSnap.exists()) creditorName = userSnap.data().displayName || userSnap.data().email;
         } catch (e) {
            console.error("Error fetching user", e);
         }
         return { id: d.id, ...data, otherUserName: creditorName };
      }));
      setYouOwe(debts);
    });

    const unsubscribe2 = onSnapshot(q2, async (snapshot) => {
      const debts = await Promise.all(snapshot.docs.map(async (d) => {
         const data = d.data();
         // Fetch debtor name
         let debtorName = 'Unknown';
         try {
            const userSnap = await getDoc(doc(db, 'users', data.debtorId));
            if (userSnap.exists()) debtorName = userSnap.data().displayName || userSnap.data().email;
         } catch (e) {
            console.error("Error fetching user", e);
         }
         return { id: d.id, ...data, otherUserName: debtorName };
      }));
      setOwedToYou(debts);
      setLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser]);

  const handleMarkPaid = async (debt) => {
    if (onSettle) onSettle(debt);
    try {
      if (currentUser && debt.id && !debt.id.startsWith('mock-') && !debt.id.startsWith('d-')) {
        await updateDoc(doc(db, 'debts', debt.id), {
          status: 'pending_confirmation',
          markedPaidAt: new Date().toISOString(),
        });
      }
      if (propDebts) {
        setYouOwe((prev) =>
          prev.map((d) => (d.id === debt.id ? { ...d, status: 'pending_confirmation' } : d))
        );
      }
      showSuccess('Marked as paid. Waiting for friend to confirm.');
      
      // Notify creditor via email
      try {
        if (debt.creditorId) {
          const creditorDoc = await getDoc(doc(db, 'users', debt.creditorId));
          if (creditorDoc.exists()) {
            await fetch('/api/send-email-gmail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'debt_marked_paid',
                userEmail: creditorDoc.data().email,
                data: {
                  debtorName: currentUser?.displayName || currentUser?.email || 'Friend',
                  amount: debt.amount,
                  description: debt.description
                }
              })
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send debt marked paid email:", emailError);
      }
    } catch (error) {
      console.error("Error marking paid:", error);
      showError('Failed to update status.');
    }
  };

  const handleCancelMarkPaid = async (debt) => {
    try {
      if (currentUser && debt.id && !debt.id.startsWith('mock-') && !debt.id.startsWith('d-')) {
        await updateDoc(doc(db, 'debts', debt.id), {
          status: 'unpaid',
        });
      }
      if (propDebts) {
        setYouOwe((prev) =>
          prev.map((d) => (d.id === debt.id ? { ...d, status: 'unpaid' } : d))
        );
      }
      showSuccess('Payment status reset to unpaid.');
    } catch (error) {
      console.error("Error resetting payment status:", error);
      showError('Failed to reset status.');
    }
  };

  const handleConfirmReceipt = async (debt) => {
    if (onSettle) onSettle(debt);
    try {
      // Mark the debt as paid (consistent with MCP handleSettleDebt and preserves audit trail)
      if (currentUser && debt.id && !debt.id.startsWith('mock-') && !debt.id.startsWith('d-')) {
        await updateDoc(doc(db, 'debts', debt.id), {
          status: 'paid',
          settledAt: new Date().toISOString(),
          settledBy: currentUser.uid,
        });
      }
      if (propDebts) {
        setOwedToYou((prev) => prev.filter((d) => d.id !== debt.id));
      }
      
      showSuccess('Payment confirmed! Debt settled.');

      // Notify debtor via email
      try {
        if (debt.debtorId) {
          const debtorDoc = await getDoc(doc(db, 'users', debt.debtorId));
          if (debtorDoc.exists()) {
            await fetch('/api/send-email-gmail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'payment_confirmed',
                userEmail: debtorDoc.data().email,
                data: {
                  creditorName: currentUser?.displayName || currentUser?.email || 'Friend',
                  amount: debt.amount,
                  description: debt.description
                }
              })
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send payment confirmed email:", emailError);
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      showError('Failed to confirm payment.');
    }
  };

  const handleRejectReceipt = async (debt) => {
    try {
      if (currentUser && debt.id && !debt.id.startsWith('mock-') && !debt.id.startsWith('d-')) {
        await updateDoc(doc(db, 'debts', debt.id), {
          status: 'unpaid',
          lastDeclinedAt: new Date().toISOString(),
        });
      }
      if (propDebts) {
        setOwedToYou((prev) =>
          prev.map((d) => (d.id === debt.id ? { ...d, status: 'unpaid' } : d))
        );
      }
      showSuccess('Payment declined. Friend can re-submit after sending.');
    } catch (error) {
      console.error("Error declining payment:", error);
      showError('Failed to decline payment.');
    }
  };

  if (loading) return <div className="p-4 text-center text-xs text-[var(--ink-3)]">Loading debts...</div>;

  if (youOwe.length === 0 && owedToYou.length === 0) return (
     <div className="flex flex-col items-center justify-center p-8 text-[var(--ink-3)]">
        <CheckCircle className="w-8 h-8 mb-2 opacity-30 text-[var(--credit)]" />
        <p className="text-xs">All settled up. No active debts.</p>
     </div>
  );

  return (
    <div className="space-y-6">
      {/* YOU OWE */}
      {youOwe.length > 0 && (
         <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--debit)] flex items-center gap-1.5">
               <TrendingDown className="w-3.5 h-3.5" /> You owe
            </h3>
            <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[6px] overflow-hidden">
              {youOwe.map(debt => (
                 <div key={debt.id} className="p-3 bg-[var(--surface)] flex justify-between items-center">
                    <div>
                       <p className="font-medium text-[var(--ink)] text-xs">{debt.otherUserName}</p>
                       <p className="text-xs text-[var(--ink-3)]">{debt.description}</p>
                       <p className="text-sm font-medium text-[var(--debit)] mt-0.5 tabular-nums">₹{debt.amount}</p>
                    </div>
                    <div>
                       {debt.status === 'pending_confirmation' ? (
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-[var(--ink-3)]">
                                <Clock className="w-3 h-3 inline mr-1" /> Pending
                             </span>
                             <button
                                type="button"
                                onClick={() => handleCancelMarkPaid(debt)}
                                className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] underline cursor-pointer"
                                title="Reset to unpaid"
                             >
                                Cancel
                             </button>
                          </div>
                        ) : (
                          <button
                             type="button"
                             onClick={() => handleMarkPaid(debt)}
                             className="btn-secondary text-xs py-1 px-2.5"
                          >
                             Mark paid
                          </button>
                        )}
                    </div>
                 </div>
              ))}
            </div>
         </div>
      )}

      {/* OWED TO YOU */}
      {owedToYou.length > 0 && (
         <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--credit)] flex items-center gap-1.5">
               <TrendingUp className="w-3.5 h-3.5" /> Owed to you
            </h3>
            <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[6px] overflow-hidden">
              {owedToYou.map(debt => (
                 <div key={debt.id} className="p-3 bg-[var(--surface)] flex justify-between items-center">
                    <div>
                       <p className="font-medium text-[var(--ink)] text-xs">{debt.otherUserName}</p>
                       <p className="text-xs text-[var(--ink-3)]">{debt.description}</p>
                       <p className="text-sm font-medium text-[var(--credit)] mt-0.5 tabular-nums">₹{debt.amount}</p>
                    </div>
                    <div>
                       {debt.status === 'pending_confirmation' ? (
                          <div className="flex items-center gap-2">
                             <button
                                type="button"
                                onClick={() => handleConfirmReceipt(debt)}
                                className="btn-primary text-xs py-1 px-2.5"
                             >
                                <Check className="w-3.5 h-3.5 inline mr-1" /> Confirm
                             </button>
                             <button
                                type="button"
                                onClick={() => handleRejectReceipt(debt)}
                                className="btn-secondary text-xs py-1 px-2 text-[var(--debit)] hover:text-[var(--debit)]"
                             >
                                Decline
                             </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--ink-3)]">Awaiting repayment</span>
                        )}
                    </div>
                 </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
}
