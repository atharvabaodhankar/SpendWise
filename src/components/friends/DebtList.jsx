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
     <div className="flex flex-col items-center justify-center p-8 text-[#94a3b8]">
        <CheckCircle className="w-12 h-12 mb-3 text-[#10b981]/40" />
        <p style={{ fontFamily: 'Geist, sans-serif' }}>All settled up! No active debts.</p>
     </div>
  );

  return (
    <div className="space-y-6">
      {/* YOU OWE */}
      {youOwe.length > 0 && (
         <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#f43f5e] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
               <TrendingDown className="w-4 h-4" /> You Owe
            </h3>
            {youOwe.map(debt => (
               <div key={debt.id} className="p-4 rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/10 backdrop-blur-md flex justify-between items-center">
                  <div>
                     <p className="font-semibold text-white">{debt.otherUserName}</p>
                     <p className="text-xs text-[#94a3b8]">{debt.description}</p>
                     <p className="text-lg font-extrabold text-[#f43f5e] mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>₹{debt.amount}</p>
                  </div>
                  <div>
                     {debt.status === 'pending_confirmation' ? (
                        <span className="badge badge-warning flex items-center gap-1.5 px-3 py-1">
                           <Clock className="w-3 h-3" /> Pending Confirmation
                        </span>
                      ) : (
                        <button
                           onClick={() => handleMarkPaid(debt)}
                           className="btn-accent text-xs font-semibold px-4 py-2"
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
            <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
               <TrendingUp className="w-4 h-4" /> Owed to You
            </h3>
            {owedToYou.map(debt => (
               <div key={debt.id} className="p-4 rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 backdrop-blur-md flex justify-between items-center">
                  <div>
                     <p className="font-semibold text-white">{debt.otherUserName}</p>
                     <p className="text-xs text-[#94a3b8]">{debt.description}</p>
                     <p className="text-lg font-extrabold text-[#10b981] mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>₹{debt.amount}</p>
                  </div>
                  <div>
                     {debt.status === 'pending_confirmation' ? (
                        <button
                           onClick={() => handleConfirmReceipt(debt)}
                           className="btn-primary text-xs font-semibold flex items-center gap-1.5 px-4 py-2"
                        >
                           <Check className="w-4 h-4" /> Confirm Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-[#64748b] italic" style={{ fontFamily: 'Geist, sans-serif' }}>Awaiting repayment</span>
                      )}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
