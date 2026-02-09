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
     return <div className="premium-card p-6 animate-pulse h-64"></div>;
  }

  return (
    <div className="premium-card overflow-hidden flex flex-col">
       {/* Header */}
      <div className="p-6 border-b border-[var(--card-border)] bg-[var(--bg-secondary)]/30 flex justify-between items-center">
         <div className="flex items-center space-x-3">
            <div className="p-2 bg-[var(--primary-100)] rounded-lg">
               <Repeat className="w-5 h-5 text-[var(--primary-600)]" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-[var(--text-primary)]">Recurring</h3>
               <p className="text-xs text-[var(--text-secondary)]">Automate regular payments</p>
            </div>
         </div>
         
         {!showForm && (
            <button
               onClick={() => setShowForm(true)}
               className="p-2 rounded-lg bg-[var(--primary-50)] text-[var(--primary-600)] hover:bg-[var(--primary-100)] transition-colors"
            >
               <Plus className="w-4 h-4" />
            </button>
         )}
      </div>

      <div className="p-6 overflow-y-auto max-h-[400px]">
        {showForm ? (
          <div className="animate-fade-scale">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-[var(--text-primary)]">New Recurring Item</h4>
               <button onClick={() => setShowForm(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X className="w-4 h-4" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="label-premium">Type</label>
                    <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-lg">
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: categories.expense[0] }))}
                          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                             formData.type === 'expense' 
                                ? 'bg-white shadow-sm text-[var(--danger-600)]' 
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                       >
                          Expense
                       </button>
                       <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: categories.income[0] }))}
                          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                             formData.type === 'income' 
                                ? 'bg-white shadow-sm text-[var(--success-600)]' 
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                       className="input-premium"
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
                       className="input-premium"
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
                       className="input-premium"
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
                    className="input-premium"
                 />
              </div>

               <div className="pt-2">
                  <button type="submit" className="btn-primary w-full justify-center">
                     Create Automation
                  </button>
               </div>
            </form>
          </div>
        ) : (
           <div className="space-y-3">
              {recurringTransactions.length === 0 ? (
                 <div className="text-center py-6 text-[var(--text-tertiary)]">
                    <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recurring items yet.</p>
                 </div>
              ) : (
                 recurringTransactions.map((transaction) => (
                    <div 
                       key={transaction.id} 
                       className="group p-3 rounded-xl border border-[var(--card-border)] hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)] transition-all bg-[var(--bg-secondary)]"
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-[var(--success-500)]' : 'bg-[var(--danger-500)]'}`}></span>
                             <h4 className="text-sm font-bold text-[var(--text-primary)]">
                                {transaction.description || transaction.category}
                             </h4>
                          </div>
                          <span className={`text-sm font-bold ${transaction.type === 'income' ? 'text-[var(--success-600)]' : 'text-[var(--text-primary)]'}`}>
                             {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(0)}
                          </span>
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-semibold bg-[var(--bg-tertiary)] px-2 py-0.5 rounded text-[var(--text-secondary)] uppercase tracking-wider">
                                {transaction.frequency}
                             </span>
                             {transaction.paymentMethod === 'online' ? (
                                <CreditCard className="w-3 h-3 text-[var(--text-tertiary)]" />
                             ) : (
                                <Wallet className="w-3 h-3 text-[var(--text-tertiary)]" />
                             )}
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                                onClick={() => executeNow(transaction)}
                                className="p-1.5 rounded-lg text-[var(--primary-600)] hover:bg-white hover:shadow-sm"
                                title="Run Now"
                             >
                                <Play className="w-3.5 h-3.5" />
                             </button>
                             <button
                                onClick={() => deleteRecurring(transaction.id)}
                                className="p-1.5 rounded-lg text-[var(--danger-600)] hover:bg-white hover:shadow-sm"
                                title="Delete"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
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