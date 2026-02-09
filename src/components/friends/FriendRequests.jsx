import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserPlus, Check, X, User } from 'lucide-react';

export default function FriendRequests() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = [];
      snapshot.forEach(doc => {
        requestsData.push({ id: doc.id, ...doc.data() });
      });
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAccept = async (request) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // 2. Add to my friends
      await setDoc(doc(db, 'users', currentUser.uid, 'friends', request.senderId), {
        email: request.senderEmail,
        friendId: request.senderId,
        createdAt: serverTimestamp()
      });

      // 3. Add me to their friends
      await setDoc(doc(db, 'users', request.senderId, 'friends', currentUser.uid), {
        email: currentUser.email,
        friendId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Notify sender that request was accepted
      try {
        await fetch('/api/send-email-gmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'friend_accepted',
            userEmail: request.senderEmail,
            data: {
              accepterName: currentUser.displayName || currentUser.email,
              accepterEmail: currentUser.email
            }
          })
        });
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
        // Don't block the UI flow if email fails
      }
      
      showSuccess(`You are now friends with ${request.senderEmail}`);
    } catch (error) {
      console.error("Error accepting request:", error);
      showError('Failed to accept request.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected'
      });
      showSuccess('Request rejected.');
    } catch (error) {
      console.error("Error rejecting request:", error);
      showError('Failed to reject request.');
    }
  };

  if (loading) return <div className="p-4 text-center text-[var(--text-secondary)]">Loading requests...</div>;

  if (requests.length === 0) return (
     <div className="flex flex-col items-center justify-center p-8 text-[var(--text-tertiary)]">
        <UserPlus className="w-12 h-12 mb-3 opacity-20" />
        <p>No new friend requests</p>
     </div>
  );

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-600)]">
                <User className="w-5 h-5" />
             </div>
             <div>
                <p className="font-semibold text-[var(--text-primary)]">{request.senderEmail}</p>
                <p className="text-xs text-[var(--text-secondary)]">wants to be friends</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(request)}
              className="p-2 rounded-lg bg-[var(--success-50)] text-[var(--success-600)] hover:bg-[var(--success-100)] transition-colors"
              title="Accept"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleReject(request.id)}
              className="p-2 rounded-lg bg-[var(--danger-50)] text-[var(--danger-500)] hover:bg-[var(--danger-100)] transition-colors"
              title="Reject"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
