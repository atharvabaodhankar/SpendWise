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
      <div className="statement-card shadow-2xl w-full max-w-md overflow-hidden p-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[var(--hairline)] mb-6">
          <div>
            <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Preferences</div>
            <h2 className="text-xl font-semibold text-[var(--navy)]">Statement Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="btn-statement p-1.5 rounded-md hover:border-[var(--rose)] hover:text-[var(--rose)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="space-y-3 pb-6 border-b border-[var(--hairline)]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--navy)]" />
                  <h3 className="font-semibold text-xs text-[var(--navy)] uppercase tracking-wider">Public Profile</h3>
                </div>
                
                <div>
                  <label className="label-premium">Display Name</label>
                  <input
                    type="text"
                    value={preferences.displayName || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Enter display name"
                    className="input-premium text-xs"
                  />
                  <p className="text-[10px] text-[var(--slate-light)] mt-1">This name will be visible to your bill-splitting friends.</p>
                </div>
              </div>

              {/* Wallet Tracking Toggle */}
              <div className="flex items-start justify-between">
                <div className="mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-[var(--navy)]" />
                    <h3 className="font-semibold text-xs text-[var(--navy)] uppercase tracking-wider">Passbook Balances</h3>
                  </div>
                  <p className="text-xs text-[var(--slate)] leading-relaxed">
                    Display current Online & Cash balance cards on the statement ledger.
                  </p>
                </div>
                
                <button 
                  onClick={handleToggleBalances}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences.showBalances ? 'bg-[var(--navy)]' : 'bg-[var(--slate-faint)]'
                  }`}
                >
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
        <div className="pt-6 mt-6 border-t border-[var(--hairline)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-statement text-[10px] py-2 px-4"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-statement-primary text-[10px] py-2 px-4 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
