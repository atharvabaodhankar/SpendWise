import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, CreditCard, AlignLeft, AlertTriangle, Users, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const categories = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Investment', 'Other'];

export default function TransactionForm({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'online',
    isSplit: false,
    splitWith: [] // Array of friend IDs
  });
  
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [affectCurrentBalance, setAffectCurrentBalance] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) return;
      setLoadingFriends(true);
      try {
         const q = query(collection(db, 'users', currentUser.uid, 'friends'), orderBy('createdAt', 'desc'));
         const snapshot = await getDocs(q);
         
         // Fetch names for each friend from 'users' collection to ensure we have display names
         const friendsData = await Promise.all(snapshot.docs.map(async (friendDoc) => {
            const data = friendDoc.data();
            const friendId = friendDoc.id;
            
            try {
               const userSnap = await getDoc(doc(db, 'users', friendId));
               if (userSnap.exists()) {
                  const userData = userSnap.data();
                  return { 
                     id: friendId, 
                     friendId,
                     email: data.email, 
                     displayName: userData.displayName || data.email 
                  };
               }
            } catch (e) {
               console.error("Error fetching friend profile:", e);
            }
            return { id: friendId, friendId, email: data.email, displayName: data.email };
         }));
         
         setFriends(friendsData);
      } catch (error) {
         console.error("Error fetching friends:", error);
      } finally {
         setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [currentUser]);

  const isHistoricalDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return formData.date < today;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const splitFriends = formData.isSplit 
       ? friends.filter(f => formData.splitWith.includes(f.friendId))
       : [];

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      isHistorical: isHistoricalDate(),
      affectCurrentBalance: isHistoricalDate() ? affectCurrentBalance : true,
      splitDetails: splitFriends
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-[var(--primary-900)]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-scale">
      <div className="premium-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-primary)] sticky top-0 z-10">
           <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Add Transaction</h2>
              <p className="text-sm text-[var(--text-secondary)]">Track a new expense</p>
           </div>
           <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--text-secondary)] hover:bg-[var(--primary-100)] transition-colors"
           >
              <X className="w-5 h-5" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           {/* Amount Input */}
           <div className="space-y-2">
              <label className="label-premium">Amount</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-[var(--text-tertiary)] font-semibold text-lg">₹</span>
                 </div>
                 <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    className="input-premium pl-10 text-xl font-bold tracking-wide"
                    autoFocus
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                 <label className="label-premium">Category</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Tag className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                    <select
                       name="category"
                       value={formData.category}
                       onChange={handleChange}
                       className="input-premium pl-10 appearance-none"
                    >
                       {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                       ))}
                    </select>
                 </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                 <label className="label-premium">Payment Method</label>
                 <div className="grid grid-cols-2 gap-2">
                    <div 
                       onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                       className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center transition-all ${
                          formData.paymentMethod === 'online' 
                             ? 'border-[var(--accent-500)] bg-[var(--accent-50)] text-[var(--accent-700)]' 
                             : 'border-[var(--card-border)] hover:border-[var(--primary-300)]'
                       }`}
                    >
                       <CreditCard className="w-5 h-5 mb-1" />
                       <span className="text-xs font-semibold">Online</span>
                    </div>
                    <div 
                       onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                       className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center transition-all ${
                          formData.paymentMethod === 'cash' 
                             ? 'border-[var(--success-500)] bg-[var(--success-50)] text-[var(--success-700)]' 
                             : 'border-[var(--card-border)] hover:border-[var(--primary-300)]'
                       }`}
                    >
                       <DollarSign className="w-5 h-5 mb-1" />
                       <span className="text-xs font-semibold">Cash</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Date & Split */}
           <div className="space-y-2">
              <label className="label-premium">Date</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                 </div>
                 <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className={`input-premium pl-10 ${isHistoricalDate() ? 'border-amber-300 bg-amber-50/30' : ''}`}
                 />
              </div>
           </div>
           
           {/* Historical Date Warning */}
           {isHistoricalDate() && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 animate-slide-down">
                 <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                       <h4 className="text-sm font-bold text-amber-800">Past Date Detected</h4>
                       <p className="text-xs text-amber-700 mt-1">
                          You are recording a transaction from the past. Should this affect your current balance?
                       </p>
                       
                       <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                             affectCurrentBalance ? 'bg-amber-600 border-amber-600' : 'border-amber-400 bg-white'
                          }`}>
                             {affectCurrentBalance && <span className="text-white text-xs">✓</span>}
                          </div>
                          <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={affectCurrentBalance}
                             onChange={e => setAffectCurrentBalance(e.target.checked)}
                          />
                          <span className="text-xs font-semibold text-amber-800 group-hover:text-amber-900">
                             Yes, deduct from my current balance
                          </span>
                       </label>
                    </div>
                 </div>
              </div>
           )}

           {/* Description */}
           <div className="space-y-2">
              <label className="label-premium">Description (Optional)</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlignLeft className="w-4 h-4 text-[var(--text-tertiary)]" />
                 </div>
                 <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Dinner details, etc."
                    className="input-premium pl-10"
                 />
              </div>
           </div>

            {/* Split Expense Section */}
            <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-[var(--primary-500)]" />
                     <span className="font-semibold text-[var(--text-primary)]">Split with Friends</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                        type="checkbox" 
                        checked={formData.isSplit} 
                        onChange={e => setFormData(prev => ({ ...prev, isSplit: e.target.checked, splitWith: [] }))}
                        className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)]"></div>
                  </label>
               </div>

               {formData.isSplit && (
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] space-y-3 animate-fade-in">
                     {loadingFriends ? (
                        <p className="text-sm text-[var(--text-secondary)]">Loading friends...</p>
                     ) : friends.length > 0 ? (
                        <>
                           <p className="text-sm text-[var(--text-secondary)] mb-2">Select friends to split with:</p>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                              {friends.map(friend => (
                                 <div 
                                    key={friend.friendId}
                                    onClick={() => {
                                       setFormData(prev => {
                                          const isActive = prev.splitWith.includes(friend.friendId);
                                          return {
                                             ...prev,
                                             splitWith: isActive 
                                                ? prev.splitWith.filter(id => id !== friend.friendId)
                                                : [...prev.splitWith, friend.friendId]
                                          };
                                       });
                                    }}
                                    className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                                       formData.splitWith.includes(friend.friendId)
                                          ? 'border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)]'
                                          : 'border-[var(--card-border)] bg-[var(--bg-primary)] hover:border-[var(--primary-300)]'
                                    }`}
                                 >
                                    <span className="text-xs font-medium truncate">{friend.displayName || friend.email}</span>
                                    {formData.splitWith.includes(friend.friendId) && <Check className="w-3.5 h-3.5" />}
                                 </div>
                              ))}
                           </div>
                           
                           {formData.splitWith.length > 0 && (
                              <div className="flex justify-between items-center pt-2 text-sm">
                                 <span className="text-[var(--text-secondary)]">Your share:</span>
                                 <span className="font-bold text-[var(--primary-600)]">
                                    ₹{(parseFloat(formData.amount || 0) / (formData.splitWith.length + 1)).toFixed(2)}
                                 </span>
                              </div>
                           )}
                        </>
                     ) : (
                        <p className="text-sm text-[var(--text-tertiary)] italic">You haven't added any friends yet.</p>
                     )}
                  </div>
               )}
            </div>

           {/* Actions */}
           <div className="pt-4 flex gap-4">
              <button
                 type="button"
                 onClick={onCancel}
                 className="flex-1 btn-secondary"
              >
                 Cancel
              </button>
              <button
                 type="submit"
                 className="flex-1 btn-primary"
              >
                 Save Expense
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}