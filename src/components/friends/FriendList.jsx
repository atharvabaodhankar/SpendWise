import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User, Users } from 'lucide-react';

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
      // Fetch profiles for each friend to get their current display names
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

  if (loading) return <div className="p-4 text-center text-[var(--text-secondary)]">Loading friends...</div>;

  if (friends.length === 0) return (
     <div className="flex flex-col items-center justify-center p-8 text-[var(--text-tertiary)]">
        <Users className="w-12 h-12 mb-3 opacity-20" />
        <p>No friends yet. Add some!</p>
     </div>
  );

  return (
    <div className="space-y-3">
      {friends.map(friend => (
        <div key={friend.id} className="p-3 rounded-xl hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors cursor-default">
           <div className="w-10 h-10 rounded-full bg-[var(--accent-100)] flex items-center justify-center text-[var(--accent-600)]">
              <User className="w-5 h-5" />
           </div>
           <div>
              <p className="font-medium text-[var(--text-primary)]">{friend.displayName || friend.email}</p>
              {friend.displayName && <p className="text-xs text-[var(--text-secondary)]">{friend.email}</p>}
           </div>
        </div>
      ))}
    </div>
  );
}
