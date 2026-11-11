import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { UserPlus, Check, X, User, Loader2 } from 'lucide-react';

export default function FriendRequests() {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsData = await Promise.all(snapshot.docs.map(async (requestDoc) => {
         const data = requestDoc.data();
         const senderId = data.senderId;
         
         try {
            const userSnap = await getDoc(doc(db, 'users', senderId));
            if (userSnap.exists()) {
               const userData = userSnap.data();
               return { 
                  id: requestDoc.id, 
                  ...data, 
                  senderName: userData.displayName || data.senderEmail 
               };
            }
         } catch (e) {
            console.error("Error fetching sender profile:", e);
         }
         return { id: requestDoc.id, ...data, senderName: data.senderEmail };
      }));
      
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAccept = async (request) => {
    try {
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      await setDoc(doc(db, 'users', currentUser.uid, 'friends', request.senderId), {
        email: request.senderEmail,
        friendId: request.senderId,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, 'users', request.senderId, 'friends', currentUser.uid), {
        email: currentUser.email,
        friendId: currentUser.uid,
        createdAt: serverTimestamp()
      });

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

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-[var(--ink-3)] flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--ink-3)]">
        <UserPlus className="w-8 h-8 mb-2 opacity-30" />
        <p>No new friend requests.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {requests.map(request => (
        <div key={request.id} className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-[var(--sunken)]/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
             <div className="w-8 h-8 rounded-full bg-[var(--sunken)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] flex-shrink-0">
                <User className="w-4 h-4" />
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--ink)] truncate">{request.senderName}</p>
                <p className="text-xs text-[var(--ink-3)] truncate">{request.senderEmail}</p>
             </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleAccept(request)}
              className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
              title="Accept"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => handleReject(request.id)}
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
              title="Reject"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
