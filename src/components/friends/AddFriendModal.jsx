import { useState } from 'react';
import { X, Search, Check, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AddFriendModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
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
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
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
      }

      setRequestSent(true);
      showSuccess('Friend request sent.');
      setTimeout(() => {
         onClose();
         setEmail('');
         setFoundUser(null);
         setRequestSent(false);
      }, 1200);

    } catch (error) {
      console.error("Error sending request:", error);
      showError('Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] w-full max-w-md overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-[var(--line)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--ink)]">Add friend</h2>
            <p className="text-xs text-[var(--ink-3)] mt-0.5">Send a request to split bills and track balances.</p>
          </div>
          <button 
            onClick={onClose}
            className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter friend's email"
                className="input-base pl-9 text-xs w-full py-2"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search user
            </button>
          </form>

          {/* Result */}
          {foundUser && (
            <div className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--ink)]">{foundUser.displayName || 'User'}</p>
                  <p className="text-xs text-[var(--ink-3)]">{foundUser.email}</p>
                </div>
              </div>
              
              {requestSent ? (
                <div className="flex items-center gap-1 text-[var(--credit)] text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Sent
                </div>
              ) : (
                <button
                  onClick={sendFriendRequest}
                  disabled={loading}
                  className="btn-primary text-xs py-1 px-3"
                >
                  Send request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
