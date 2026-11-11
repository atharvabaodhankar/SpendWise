import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  X, 
  User, 
  Wallet, 
  Save, 
  Loader2, 
  Key,
  SlidersHorizontal 
} from 'lucide-react';
import ApiKeyManager from './ApiKeyManager';

export default function SettingsModal({ isOpen, onClose, initialTab = 'preferences' }) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    displayName: '',
    showBalances: true,
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    async function loadPreferences() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setPreferences({
            displayName: data.displayName || currentUser.displayName || '',
            showBalances: data.preferences?.showBalances ?? true,
          });
        } else {
          setPreferences({
            displayName: currentUser.displayName || '',
            showBalances: true,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        showError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen, currentUser, showError]);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaving(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: preferences.displayName.trim(),
        'preferences.showBalances': preferences.showBalances,
        updatedAt: new Date()
      });
      showSuccess("Settings updated successfully.");
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
      showError("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBalances = () => {
    setPreferences(prev => ({ ...prev, showBalances: !prev.showBalances }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] w-full ${activeTab === 'api' ? 'max-w-3xl' : 'max-w-xl'} overflow-hidden p-6 max-h-[92vh] flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-[var(--line)] flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--ink)]">Settings and integrations</h2>
            <p className="text-xs text-[var(--ink-3)] mt-0.5">Manage your preferences and MCP API keys.</p>
          </div>
          <button 
            onClick={onClose}
            className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 pt-4 pb-2 border-b border-[var(--line)] flex-shrink-0">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            General preferences
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            API keys and MCP
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-5 flex-1 pr-1">
          {activeTab === 'preferences' ? (
            loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Settings */}
                <div className="space-y-3 pb-6 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--ink-2)]" />
                    <h3 className="font-medium text-xs text-[var(--ink)]">Public profile</h3>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">Display name</label>
                    <input
                      type="text"
                      value={preferences.displayName || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Enter display name"
                      className="input-base text-xs w-full py-1.5"
                    />
                    <p className="text-xs text-[var(--ink-3)] mt-1">
                      This name will be visible to your bill-splitting friends.
                    </p>
                  </div>
                </div>

                {/* Wallet Tracking Toggle */}
                <div className="flex items-start justify-between">
                  <div className="mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-[var(--ink-2)]" />
                      <h3 className="font-medium text-xs text-[var(--ink)]">Wallet balances</h3>
                    </div>
                    <p className="text-xs text-[var(--ink-3)] leading-relaxed">
                      Display Online and Cash balance split on the ledger.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleToggleBalances}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      preferences.showBalances ? 'bg-[var(--accent)]' : 'bg-[var(--line-strong)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.showBalances ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          ) : (
            <ApiKeyManager />
          )}
        </div>

        {/* Footer (only needed for preferences tab) */}
        {activeTab === 'preferences' && (
          <div className="pt-4 border-t border-[var(--line)] flex justify-end gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
