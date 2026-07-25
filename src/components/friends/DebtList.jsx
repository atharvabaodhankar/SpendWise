import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TrendingUp, TrendingDown, CheckCircle, Clock, Check } from 'lucide-react';

export default function DebtList() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [youOwe, setYouOwe] = useState([]);
  const [owedToYou, setOwedToYou] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    try {
      await updateDoc(doc(db, 'debts', debt.id), {
        status: 'pending_confirmation'
      });
      showSuccess('Marked as paid. Waiting for friend to confirm.');
      
      // Notify creditor via email
      try {
        const creditorDoc = await getDoc(doc(db, 'users', debt.creditorId));
        if (creditorDoc.exists()) {
          await fetch('/api/send-email-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'debt_marked_paid',
              userEmail: creditorDoc.data().email,
              data: {
                debtorName: currentUser.displayName || currentUser.email,
                amount: debt.amount,
                description: debt.description
              }
            })
          });
        }
      } catch (emailError) {
        console.error("Failed to send debt marked paid email:", emailError);
      }
    } catch (error) {
      console.error("Error marking paid:", error);
      showError('Failed to update status.');
    }
  };

  const handleConfirmReceipt = async (debt) => {
    try {
      // Delete the debt record to clear it
      await deleteDoc(doc(db, 'debts', debt.id));
      
      showSuccess('Payment confirmed! Debt settled.');

      // Notify debtor via email
      try {
        const debtorDoc = await getDoc(doc(db, 'users', debt.debtorId));
        if (debtorDoc.exists()) {
          await fetch('/api/send-email-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment_confirmed',
              userEmail: debtorDoc.data().email,
              data: {
                creditorName: currentUser.displayName || currentUser.email,
                amount: debt.amount,
                description: debt.description
              }
            })
          });
        }
      } catch (emailError) {
        console.error("Failed to send payment confirmed email:", emailError);
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      showError('Failed to confirm payment.');
    }
  };

  if (loading) return <div className="p-4 text-center text-[var(--text-secondary)]">Loading debts...</div>;

  if (youOwe.length === 0 && owedToYou.length === 0) return (
     <div className="flex flex-col items-center justify-center p-8 text-[var(--slate-light)]">
        <CheckCircle className="w-10 h-10 mb-3 opacity-30 text-[var(--emerald)]" />
        <p className="font-mono text-xs uppercase tracking-wider">All settled up! No active debts.</p>
     </div>
  );

  return (
    <div className="space-y-6">
      {/* YOU OWE */}
      {youOwe.length > 0 && (
         <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--rose)] uppercase tracking-wider flex items-center gap-2 font-mono">
               <TrendingDown className="w-3.5 h-3.5" /> You Owe
            </h3>
            {youOwe.map(debt => (
               <div key={debt.id} className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex justify-between items-center shadow-sm">
                  <div>
                     <p className="font-semibold text-[var(--navy)] text-sm">{debt.otherUserName}</p>
                     <p className="text-xs text-[var(--slate-light)] mt-0.5">{debt.description}</p>
                     <p className="font-mono text-base font-semibold text-[var(--rose)] mt-1 tabular-nums">₹{debt.amount}</p>
                  </div>
                  <div>
                     {debt.status === 'pending_confirmation' ? (
                        <span className="badge badge-warning">
                           <Clock className="w-3 h-3 inline mr-1" /> Pending
                        </span>
                      ) : (
                        <button
                           onClick={() => handleMarkPaid(debt)}
                           className="btn-statement text-[10px] py-1.5 px-3"
                        >
                           Mark Paid
                        </button>
                      )}
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* OWED TO YOU */}
      {owedToYou.length > 0 && (
         <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--emerald-dark)] uppercase tracking-wider flex items-center gap-2 font-mono">
               <TrendingUp className="w-3.5 h-3.5" /> Owed to You
            </h3>
            {owedToYou.map(debt => (
               <div key={debt.id} className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex justify-between items-center shadow-sm">
                  <div>
                     <p className="font-semibold text-[var(--navy)] text-sm">{debt.otherUserName}</p>
                     <p className="text-xs text-[var(--slate-light)] mt-0.5">{debt.description}</p>
                     <p className="font-mono text-base font-semibold text-[var(--emerald-dark)] mt-1 tabular-nums">₹{debt.amount}</p>
                  </div>
                  <div>
                     {debt.status === 'pending_confirmation' ? (
                        <button
                           onClick={() => handleConfirmReceipt(debt)}
                           className="btn-statement-primary text-[10px] py-1.5 px-3"
                        >
                           <Check className="w-3.5 h-3.5 inline mr-1" /> Confirm
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--slate-light)] uppercase tracking-wider">Awaiting repayment</span>
                      )}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
