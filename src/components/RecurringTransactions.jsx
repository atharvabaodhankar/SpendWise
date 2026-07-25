import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Repeat, Plus, Trash2, Play, CalendarClock, Check, X, CreditCard, Wallet } from 'lucide-react';

const frequencies = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
};

const categories = {
  income: ['Salary', 'Freelance', 'Investment', 'Other'],
  expense: ['Bills', 'Rent', 'Subscription', 'Insurance', 'Other']
};

export default function RecurringTransactions() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Bills',
    description: '',
    frequency: 'monthly',
    paymentMethod: 'online'
  });

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'recurringTransactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recurringData = [];
      querySnapshot.forEach((doc) => {
        recurringData.push({ id: doc.id, ...doc.data() });
      });
      setRecurringTransactions(recurringData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'recurringTransactions'), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: currentUser.uid,
        createdAt: new Date(),
        lastExecuted: null,
        nextExecution: getNextExecutionDate(formData.frequency)
      });
      
      setShowForm(false);
      setFormData({
        type: 'expense',
        amount: '',
        category: 'Bills',
        description: '',
        frequency: 'monthly',
        paymentMethod: 'online'
      });
      showSuccess('Recurring transaction created successfully!');
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      showError('Failed to create recurring transaction.');
    }
  };

  const deleteRecurring = async (id) => {
    try {
      await deleteDoc(doc(db, 'recurringTransactions', id));
      showSuccess('Recurring transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      showError('Failed to delete recurring transaction.');
    }
  };

  const executeNow = async (recurringTransaction) => {
    try {
      // Add the transaction
      await addDoc(collection(db, 'transactions'), {
        type: recurringTransaction.type,
        amount: recurringTransaction.amount,
        category: recurringTransaction.category,
        description: `${recurringTransaction.description} (Recurring)`,
        paymentMethod: recurringTransaction.paymentMethod || 'online',
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.uid,
        createdAt: new Date()
      });

      showSuccess(`Recurring ${recurringTransaction.type} of ₹${recurringTransaction.amount.toFixed(2)} executed!`);
    } catch (error) {
      console.error('Error executing recurring transaction:', error);
      showError('Failed to execute recurring transaction.');
    }
  };

  const getNextExecutionDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
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
     return <div className="statement-card p-6 animate-pulse h-48"></div>;
  }

  return (
    <div className="statement-card overflow-hidden flex flex-col">
       {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[var(--hairline)] mb-4">
         <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-[var(--navy)] text-white flex items-center justify-center font-mono text-xs">
               S
            </div>
            <div>
               <div className="text-[9px] tracking-[1.5px] text-[var(--slate-light)] uppercase font-semibold">Automations</div>
               <h3 className="text-sm font-semibold text-[var(--navy)]">Recurring Entries</h3>
            </div>
         </div>
         
         {!showForm && (
            <button
               onClick={() => setShowForm(true)}
               className="btn-statement text-[10px] py-1.5 px-3 flex items-center gap-1"
            >
               <Plus className="w-3.5 h-3.5" /> New
            </button>
         )}
      </div>

      <div className="overflow-y-auto max-h-[350px]">
        {showForm ? (
          <div className="animate-fade-scale">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-semibold text-xs text-[var(--navy)] uppercase tracking-wider">New Recurring Entry</h4>
               <button onClick={() => setShowForm(false)} className="btn-statement p-1 text-[var(--slate)] hover:text-[var(--rose)]">
                  <X className="w-3.5 h-3.5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="label-premium">Type</label>
                    <div className="flex bg-[var(--canvas)] p-1 rounded-md border border-[var(--hairline)]">
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: categories.expense[0] }))}
                          className={`flex-1 text-[10px] font-semibold py-1 rounded transition-all uppercase font-mono ${
                             formData.type === 'expense' 
                                ? 'bg-[var(--navy)] text-white shadow-sm' 
                                : 'text-[var(--slate)] hover:text-[var(--navy)]'
                          }`}
                       >
                          Expense
                       </button>
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: categories.income[0] }))}
                          className={`flex-1 text-[10px] font-semibold py-1 rounded transition-all uppercase font-mono ${
                             formData.type === 'income' 
                                ? 'bg-[var(--emerald)] text-white shadow-sm' 
                                : 'text-[var(--slate)] hover:text-[var(--navy)]'
                          }`}
                       >
                          Income
                       </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="label-premium">Amount</label>
                    <input
                       type="number"
                       name="amount"
                       value={formData.amount}
                       onChange={handleChange}
                       placeholder="0.00"
                       required
                       className="input-premium text-xs font-mono"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="label-premium">Category</label>
                    <select
                       name="category"
                       value={formData.category}
                       onChange={handleChange}
                       className="input-premium text-xs"
                    >
                       {categories[formData.type].map(category => (
                          <option key={category} value={category}>{category}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className="label-premium">Frequency</label>
                    <select
                       name="frequency"
                       value={formData.frequency}
                       onChange={handleChange}
                       className="input-premium text-xs font-mono"
                    >
                       {Object.entries(frequencies).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                       ))}
                    </select>
                 </div>
              </div>
              
              <div>
                 <label className="label-premium">Description</label>
                 <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Netflix Subscription"
                    className="input-premium text-xs"
                 />
              </div>

               <div className="pt-2">
                  <button type="submit" className="btn-statement-primary text-[10px] w-full justify-center py-2.5">
                     Create Automation
                  </button>
               </div>
            </form>
          </div>
        ) : (
           <div className="space-y-2">
              {recurringTransactions.length === 0 ? (
                 <div className="text-center py-6 text-[var(--slate-light)]">
                    <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No recurring automations set.</p>
                 </div>
              ) : (
                 recurringTransactions.map((transaction) => (
                    <div 
                       key={transaction.id} 
                       className="ledger-row p-3 text-xs flex items-center justify-between group"
                    >
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="font-semibold text-[var(--navy)]">
                                {transaction.description || transaction.category}
                             </span>
                             <span className="method-pill text-[8px] py-0.5 px-1.5">{transaction.frequency}</span>
                          </div>
                          <div className="text-[10px] text-[var(--slate-light)] uppercase tracking-wider font-mono mt-0.5">
                             {transaction.category} • {transaction.paymentMethod}
                          </div>
                       </div>

                       <div className="flex items-center gap-3">
                          <span className={`font-mono font-semibold tabular-nums ${transaction.type === 'income' ? 'text-[var(--emerald)]' : 'text-[var(--rose)]'}`}>
                             {transaction.type === 'income' ? '+' : '−'}₹{transaction.amount.toFixed(2)}
                          </span>
                          
                          <div className="flex gap-1">
                             <button
                                onClick={() => executeNow(transaction)}
                                className="btn-statement p-1 hover:border-[var(--emerald)] hover:text-[var(--emerald)]"
                                title="Run Now"
                             >
                                <Play className="w-3 h-3" />
                             </button>
                             <button
                                onClick={() => deleteRecurring(transaction.id)}
                                className="btn-statement p-1 hover:border-[var(--rose)] hover:text-[var(--rose)]"
                                title="Delete"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}
      </div>
    </div>
  );
}