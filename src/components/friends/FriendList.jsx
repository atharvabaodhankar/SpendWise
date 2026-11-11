import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User, Users, Loader2 } from 'lucide-react';

export default function FriendList() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'friends'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendsData = await Promise.all(snapshot.docs.map(async (friendDoc) => {
         const data = friendDoc.data();
         const friendId = friendDoc.id;
         
         try {
            const userSnap = await getDoc(doc(db, 'users', friendId));
            if (userSnap.exists()) {
               const userData = userSnap.data();
               return { 
                  id: friendId, 
                  ...data, 
                  displayName: userData.displayName || data.email 
               };
            }
         } catch (e) {
            console.error("Error fetching friend profile:", e);
         }
         return { id: friendId, ...data, displayName: data.email };
      }));
      
      setFriends(friendsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-[var(--ink-3)] flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
        Loading friends...
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--ink-3)]">
        <Users className="w-8 h-8 mb-2 opacity-30" />
        <p>No friends added yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--line)]">
      {friends.map(friend => (
        <div key={friend.id} className="py-2.5 px-3 flex items-center gap-3 hover:bg-[var(--sunken)]/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[var(--sunken)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-2)] flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--ink)] truncate">{friend.displayName || friend.email}</p>
            {friend.displayName && <p className="text-xs text-[var(--ink-3)] truncate">{friend.email}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
