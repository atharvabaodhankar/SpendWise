import { useState } from 'react';
import { X, Search, UserPlus, Check, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AddFriendModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim() || email === currentUser.email) return;

    setLoading(true);
    setFoundUser(null);
    setRequestSent(false);

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setFoundUser({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        showError('User not found.');
      }
    } catch (error) {
      console.error("Error searching user:", error);
      showError('Failed to search user.');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!foundUser) return;
    setLoading(true);

    try {
      // Check if request already exists (simple check, ideally should be more robust)
      const q = query(
         collection(db, 'friendRequests'), 
         where('senderId', '==', currentUser.uid),
         where('receiverId', '==', foundUser.id),
         where('status', '==', 'pending')
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
         showError('Request already sent.');
         setLoading(false);
         return;
      }

      await addDoc(collection(db, 'friendRequests'), {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        receiverId: foundUser.id,
        receiverEmail: foundUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Send email notification via Vercel API
      try {
         await fetch('/api/send-email-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               type: 'friend_request',
               userEmail: foundUser.email,
               data: {
                  senderName: currentUser.displayName || currentUser.email,
                  senderEmail: currentUser.email
               }
            })
         });
      } catch (emailError) {
         console.error("Failed to send email alert:", emailError);
         // Don't block the UI flow if email fails
      }

      setRequestSent(true);
      showSuccess('Friend request sent!');
      setTimeout(() => {
         onClose();
         setEmail('');
         setFoundUser(null);
         setRequestSent(false);
      }, 1500);

    } catch (error) {
      console.error("Error sending request:", error);
      showError('Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md border border-[var(--card-border)] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-secondary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Add Friend</h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
               <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter friend's email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                  autoFocus
               />
            </div>
            <button
               type="submit"
               disabled={loading || !email.trim()}
               className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
               Search
            </button>
          </form>

          {/* Result */}
          {foundUser && (
             <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-600)]">
                      <User className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="font-semibold text-[var(--text-primary)]">{foundUser.displayName || 'User'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{foundUser.email}</p>
                   </div>
                </div>
                
                {requestSent ? (
                   <div className="flex items-center gap-1 text-[var(--success-500)] font-medium text-sm">
                      <Check className="w-4 h-4" />
                      Sent
                   </div>
                ) : (
                   <button
                      onClick={sendFriendRequest}
                      disabled={loading}
                      className="p-2 rounded-lg bg-[var(--primary-50)] text-[var(--primary-600)] hover:bg-[var(--primary-100)] transition-colors"
                      title="Send Request"
                   >
                      <UserPlus className="w-5 h-5" />
                   </button>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
