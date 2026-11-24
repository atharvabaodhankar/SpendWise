import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, Trash2, CalendarClock, Play, Pause, X, RefreshCw } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { getLocalTodayString } from '../utils/dateUtils';

function computeNextExecution(frequency) {
  const d = new Date();
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function RecurringTransactions() {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Subscription',
    paymentMethod: 'online',
    frequency: 'monthly',
  });

  const categories = {
    expense: ['Subscription', 'Bills', 'Rent', 'EMI', 'Investment', 'Other'],
    income: ['Salary', 'Freelance', 'Rent', 'Interest', 'Other']
  };

  const frequencies = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'recurringTransactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recurring = [];
      snapshot.forEach((doc) => {
        recurring.push({ id: doc.id, ...doc.data() });
      });
      setRecurringTransactions(recurring);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recurring transactions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid amount.');
      return;
    }

    try {
      await addDoc(collection(db, 'recurringTransactions'), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        lastExecuted: null,
        nextExecution: computeNextExecution(formData.frequency),
        status: 'active',
      });

      setShowForm(false);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: 'Subscription',
        paymentMethod: 'online',
        frequency: 'monthly',
      });
      showSuccess('Recurring transaction scheduled.');
    } catch (error) {
      console.error("Error adding recurring transaction:", error);
      showError('Failed to schedule recurring transaction.');
    }
  };

  const deleteRecurring = async (id) => {
    try {
      await deleteDoc(doc(db, 'recurringTransactions', id));
      showSuccess('Recurring entry removed.');
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      showError('Failed to remove recurring entry.');
    }
  };

  const togglePause = async (transaction) => {
    try {
      const nextStatus = transaction.status === 'paused' ? 'active' : 'paused';
      await updateDoc(doc(db, 'recurringTransactions', transaction.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      showSuccess(`Recurring entry ${nextStatus === 'paused' ? 'paused' : 'resumed'}.`);
    } catch (error) {
      console.error("Error updating recurring status:", error);
      showError('Failed to update status.');
    }
  };

  const executeNow = async (transaction) => {
    try {
      const today = getLocalTodayString();
      await addDoc(collection(db, 'transactions'), {
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        description: `${transaction.description || transaction.category} (Automated)`,
        date: today,
        userId: currentUser.uid,
        createdAt: new Date(),
        affectCurrentBalance: true,
        source: 'recurring_schedule',
      });

      // Adjust wallet balances
      const amt = Number(transaction.amount) || 0;
      const pm = (transaction.paymentMethod || '').toLowerCase() === 'cash' ? 'cash' : 'online';
      const delta = transaction.type === 'income' ? amt : -amt;
      const balanceRef = doc(db, 'currentBalances', currentUser.uid);
      const bSnap = await getDoc(balanceRef);
      if (bSnap.exists()) {
        const cur = bSnap.data();
        await setDoc(
          balanceRef,
          {
            ...cur,
            [pm]: (Number(cur[pm]) || 0) + delta,
            lastUpdated: new Date(),
            updatedBy: 'recurring_runner',
          },
          { merge: true }
        );
      }

      // Update lastExecuted and nextExecution
      if (transaction.id) {
        await updateDoc(doc(db, 'recurringTransactions', transaction.id), {
          lastExecuted: today,
          nextExecution: computeNextExecution(transaction.frequency),
        });
      }

      showSuccess('Transaction executed and wallet balance adjusted.');
    } catch (error) {
      console.error("Error executing transaction:", error);
      showError('Failed to execute transaction.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { category: categories[value][0] })
    }));
  };

  if (loading) {
     return <div className="p-4 text-center text-xs text-[var(--ink-3)]">Loading recurring entries...</div>;
  }

  return (
    <div className="border border-[var(--line)] rounded-[6px] bg-[var(--surface)] p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
         <div>
            <h4 className="text-xs font-semibold text-[var(--ink)]">Recurring entries</h4>
            <p className="text-xs text-[var(--ink-3)]">Automate your regular subscriptions and bills.</p>
         </div>
         
         {!showForm && (
            <button
               onClick={() => setShowForm(true)}
               className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
            >
               <Plus className="w-3.5 h-3.5" /> New
            </button>
         )}
      </div>

      <div>
        {showForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-xs font-medium text-[var(--ink)]">New recurring entry</span>
               <button onClick={() => setShowForm(false)} className="btn-quiet p-1 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer">
                  <X className="w-3.5 h-3.5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Type</label>
                    <div className="flex bg-[var(--sunken)] p-0.5 rounded-[6px]">
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: categories.expense[0] }))}
                          className={`flex-1 text-xs py-1 rounded-[4px] transition-colors cursor-pointer ${
                             formData.type === 'expense' 
                                ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-xs' 
                                : 'text-[var(--ink-3)]'
                          }`}
                       >
                          Expense
                       </button>
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: categories.income[0] }))}
                          className={`flex-1 text-xs py-1 rounded-[4px] transition-colors cursor-pointer ${
                             formData.type === 'income' 
                                ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-xs' 
                                : 'text-[var(--ink-3)]'
                          }`}
                       >
                          Income
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Amount</label>
                    <input
                       type="number"
                       name="amount"
                       value={formData.amount}
                       onChange={handleChange}
                       placeholder="0.00"
                       required
                       className="input-base text-xs w-full py-1.5 tabular-nums"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Category</label>
                    <CustomSelect
                       name="category"
                       value={formData.category}
                       onChange={handleChange}
                       className="text-xs w-full h-9"
                    >
                       {categories[formData.type].map(category => (
                          <option key={category} value={category}>{category}</option>
                       ))}
                    </CustomSelect>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Frequency</label>
                    <CustomSelect
                       name="frequency"
                       value={formData.frequency}
                       onChange={handleChange}
                       className="text-xs w-full h-9"
                    >
                       {Object.entries(frequencies).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                       ))}
                    </CustomSelect>
                 </div>
              </div>
              
              <div>
                 <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Description</label>
                 <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Netflix Subscription"
                    className="input-base text-xs w-full py-1.5"
                 />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                 <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary text-xs"
                 >
                    Cancel
                 </button>
                 <button type="submit" className="btn-primary text-xs">
                    Create entry
                 </button>
              </div>
            </form>
          </div>
        ) : (
           <div className="space-y-2">
              {recurringTransactions.length === 0 ? (
                 <div className="text-center py-6 text-[var(--ink-3)]">
                    <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No recurring automations set.</p>
                 </div>
              ) : (
                 <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[6px] overflow-hidden">
                   {recurringTransactions.map((transaction) => (
                      <div 
                         key={transaction.id} 
                         className="p-2.5 bg-[var(--surface)] text-xs flex items-center justify-between"
                      >
                         <div>
                            <div className="flex items-center gap-2">
                               <span className="font-medium text-[var(--ink)]">
                                  {transaction.description || transaction.category}
                               </span>
                               <span className="text-xs text-[var(--ink-3)]">({transaction.frequency})</span>
                               {transaction.status === 'paused' ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-3)] font-medium">
                                    Paused
                                  </span>
                               ) : (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--credit-soft)] text-[var(--credit)] font-medium">
                                    Active
                                  </span>
                               )}
                            </div>
                            <div className="text-xs text-[var(--ink-3)] mt-0.5">
                               {transaction.category} · {transaction.paymentMethod === 'online' ? 'Online' : 'Cash'}
                            </div>
                         </div>

                         <div className="flex items-center gap-3">
                            <span className={`tabular-nums font-medium ${transaction.type === 'income' ? 'text-[var(--credit)]' : 'text-[var(--debit)]'}`}>
                               {transaction.type === 'income' ? '+' : '−'}₹{transaction.amount.toFixed(2)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                               <button
                                  type="button"
                                  onClick={() => togglePause(transaction)}
                                  className="btn-quiet p-1 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                                  title={transaction.status === 'paused' ? 'Resume recurring schedule' : 'Pause recurring schedule'}
                               >
                                  {transaction.status === 'paused' ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                                  ) : (
                                    <Pause className="w-3.5 h-3.5" />
                                  )}
                               </button>
                               <button
                                  type="button"
                                  onClick={() => executeNow(transaction)}
                                  className="btn-quiet p-1 text-[var(--ink-3)] hover:text-[var(--credit)] cursor-pointer"
                                  title="Run now"
                               >
                                  <Play className="w-3.5 h-3.5" />
                               </button>
                               <button
                                  onClick={() => deleteRecurring(transaction.id)}
                                  className="btn-quiet p-1 text-[var(--ink-3)] hover:text-[var(--debit)] cursor-pointer"
                                  title="Delete"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
