import { useState, useEffect } from 'react';
import { X, Wallet, Check, Save, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function SettingsModal({ isOpen, onClose, onUpdatePreferences }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    showBalances: true,
    displayName: ''
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      loadPreferences();
    }
  }, [isOpen, currentUser]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'userPreferences', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPreferences(docSnap.data());
      } else {
        // Default preferences
        setPreferences({ showBalances: true });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  // Load public profile data as well
  useEffect(() => {
     const loadProfile = async () => {
        if (!currentUser) return;
        try {
           const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
           if (userDoc.exists()) {
              setPreferences(prev => ({
                 ...prev,
                 displayName: userDoc.data().displayName || ''
              }));
           }
        } catch (error) {
           console.error("Error loading profile:", error);
        }
     };
     loadProfile();
  }, [currentUser, isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'userPreferences', currentUser.uid), {
        showBalances: preferences.showBalances
      });

      // Save public profile
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: preferences.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        updatedAt: new Date()
      }, { merge: true });
      
      if (onUpdatePreferences) {
        onUpdatePreferences(preferences);
      }
      
      showSuccess('Settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBalances = () => {
    setPreferences(prev => ({ ...prev, showBalances: !prev.showBalances }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md border border-[var(--card-border)] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-secondary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-tertiary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-400)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="space-y-4 pb-6 border-b border-[var(--card-border)]">
                 <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[var(--primary-500)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Profile</h3>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-sm text-[var(--text-secondary)]">Display Name</label>
                    <input
                       type="text"
                       value={preferences.displayName || ''}
                       onChange={(e) => setPreferences(prev => ({ ...prev, displayName: e.target.value }))}
                       placeholder="Enter your name"
                       className="w-full px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                    />
                    <p className="text-xs text-[var(--text-tertiary)]">This name will be visible to your friends.</p>
                 </div>
              </div>

              {/* Wallet Tracking Toggle */}
              <div className="flex items-start justify-between">
                <div className="mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-[var(--primary-500)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Wallet Balance Tracking</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Show "Total Portfolio", "Online", and "Cash" balances on the dashboard. 
                    <br/><span className="text-xs text-[var(--text-tertiary)] opacity-80">Disable this if you only want to track income/expenses without managing current balances.</span>
                  </p>
                </div>
                
                <button 
                  onClick={handleToggleBalances}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showBalances ? 'bg-[var(--accent-500)]' : 'bg-[var(--primary-200)] dark:bg-[var(--primary-700)]'
                  }`}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.showBalances ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--card-border)] bg-[var(--bg-secondary)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
