import { useState } from 'react';
import { X, UserPlus, Users, Inbox } from 'lucide-react';
import FriendList from './FriendList';
import FriendRequests from './FriendRequests';
import AddFriendModal from './AddFriendModal';

export default function FriendsManagerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'requests'
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--card-border)] overflow-hidden animate-scale-up flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-secondary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Friends</h2>
          <div className="flex gap-2">
             <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--primary-100)] text-[var(--primary-700)] hover:bg-[var(--primary-200)] transition-colors text-sm font-medium"
             >
                <UserPlus className="w-4 h-4" />
                Add Friend
             </button>
             <button 
               onClick={onClose}
               className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-tertiary)]"
             >
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--card-border)] bg-[var(--bg-primary)]">
           <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                 activeTab === 'list' 
                    ? 'text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
           >
              <Users className="w-4 h-4" />
              My Friends
           </button>
           <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                 activeTab === 'requests' 
                    ? 'text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
           >
              <Inbox className="w-4 h-4" />
              Requests
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[var(--bg-primary)]">
           {activeTab === 'list' ? <FriendList /> : <FriendRequests />}
        </div>
      </div>
      
      {/* Nested Modal */}
      <AddFriendModal 
         isOpen={showAddModal} 
         onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
}
