import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import FriendList from './FriendList';
import FriendRequests from './FriendRequests';
import AddFriendModal from './AddFriendModal';
import DebtList from './DebtList';

/**
 * FriendsManagerModal component
 *
 * Implements Section 5.8:
 * - Desktop (>=640px): centred dialog, max width 520px, 14px radius, --surface, --shadow-pop.
 * - Mobile (<640px): bottom sheet, full width, max height 92dvh, 14px top corners.
 * - Focus trap, Esc closes, backdrop click closes.
 * - Text tabs with accent underline (no segmented pills).
 */
export default function FriendsManagerModal({ isOpen, onClose, initialTab = 'list', debts, onSettle }) {
  const [activeTab, setActiveTab] = useState(() => (debts ? 'debts' : initialTab));
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Friends and splits"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog / Sheet */}
      <div className="relative w-full sm:max-w-[520px] max-h-[92dvh] bg-[var(--surface)] border border-[var(--line)] rounded-t-[14px] sm:rounded-[14px] shadow-[var(--shadow-pop)] overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--line)] flex justify-between items-center bg-[var(--surface)]">
          <h2 className="text-base font-semibold text-[var(--ink)]">Friends and splits</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-quiet h-8 px-2.5 text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add friend</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[6px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Tabs with Accent Underline */}
        <div className="flex border-b border-[var(--line)] px-5 bg-[var(--surface)] gap-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
            className={`py-3 text-xs font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'list'
                ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            Friends
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
            className={`py-3 text-xs font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'requests'
                ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            Requests
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'debts'}
            onClick={() => setActiveTab('debts')}
            className={`py-3 text-xs font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === 'debts'
                ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
            }`}
          >
            Debts
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'list' && <FriendList />}
          {activeTab === 'requests' && <FriendRequests />}
          {activeTab === 'debts' && <DebtList debts={debts} onSettle={onSettle} />}
        </div>
      </div>

      {/* Nested Add Friend Modal */}
      {showAddModal && (
        <AddFriendModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
