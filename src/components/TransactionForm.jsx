import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Investment',
  'Groceries',
  'Utilities',
  'Personal',
  'Other',
];

/**
 * TransactionForm component
 *
 * Implements Section 5.3:
 * - Desktop: right-side drawer, 440px wide, 14px radius on the left corners only.
 * - Mobile: full-height bottom sheet with a sticky footer holding the Save button.
 * - Amount field first and large (32px, inputmode="decimal", autofocus).
 * - Segmented control for Expense / Income.
 * - Category picker (list of text chips, wrap, max 8 visible with "More").
 * - Payment method as segmented control (Online / Cash).
 * - Date, note, and "Split with friends" switch that reveals friend selection.
 * - Labels sentence case, 13px. Errors under field in --debit text.
 * - Primary button text: "Save expense" (or "Save income"). Confirmation toast says "Expense saved".
 */
export default function TransactionForm({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cash'
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [splitWith, setSplitWith] = useState([]); // array of friendIds
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' or 'custom'
  const [customAmounts, setCustomAmounts] = useState({});
  const [affectCurrentBalance, setAffectCurrentBalance] = useState(true);
  const [error, setError] = useState('');

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) return;
      setLoadingFriends(true);
      try {
        const q = query(collection(db, 'users', currentUser.uid, 'friends'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const friendsData = await Promise.all(
          snapshot.docs.map(async (friendDoc) => {
            const data = friendDoc.data();
            const friendId = friendDoc.id;
            try {
              const userSnap = await getDoc(doc(db, 'users', friendId));
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  id: friendId,
                  friendId,
                  email: data.email,
                  displayName: userData.displayName || data.email,
                };
              }
            } catch (e) {
              console.error('Error fetching friend profile:', e);
            }
            return { id: friendId, friendId, email: data.email, displayName: data.email };
          })
        );

        setFriends(friendsData);
      } catch (err) {
        console.error('Error fetching friends:', err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [currentUser]);

  const isHistoricalDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  };

  const handleFriendToggle = (friendId) => {
    setSplitWith((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    const splitFriends = isSplit
      ? friends
          .filter((f) => splitWith.includes(f.friendId))
          .map((friend) => ({
            ...friend,
            customAmount: splitMode === 'custom' ? parseFloat(customAmounts[friend.friendId] || 0) : null,
          }))
      : [];

    onSubmit({
      type,
      amount: parsedAmount,
      category,
      paymentMethod,
      date,
      description: description.trim() || category,
      isSplit,
      splitWith,
      splitDetails: splitFriends,
      splitMode,
      isHistorical: isHistoricalDate(),
      affectCurrentBalance: isHistoricalDate() ? affectCurrentBalance : true,
    });
  };

  const visibleCategories = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={type === 'expense' ? 'Add expense' : 'Add income'}
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Drawer on Desktop (440px wide, 14px left corners), Bottom Sheet on Mobile (<640px full height) */}
      <div className="relative w-full sm:max-w-[440px] h-[92dvh] sm:h-full bg-[var(--surface)] border-l sm:border-[var(--line)] rounded-t-[14px] sm:rounded-t-none sm:rounded-l-[14px] shadow-[var(--shadow-pop)] flex flex-col z-10 overflow-hidden self-end sm:self-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface)]">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            {type === 'expense' ? 'Add expense' : 'Add income'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Amount Field (First and large: 32px, inputmode="decimal", autofocus) */}
          <div>
            <label className="field-label" htmlFor="amount-input">
              Amount
            </label>
            <div className="relative flex items-center border-b-2 border-[var(--line-strong)] focus-within:border-[var(--accent)] pb-1 transition-colors">
              <span className="text-2xl font-light text-[var(--ink-3)] mr-2 select-none">₹</span>
              <input
                id="amount-input"
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError('');
                }}
                className="w-full text-3xl font-light text-[var(--ink)] bg-transparent outline-none tabular-nums"
              />
            </div>
            {error && <p className="text-xs text-[var(--debit)] mt-1.5">{error}</p>}
          </div>

          {/* Segmented Control: Expense / Income */}
          <div>
            <label className="field-label">Transaction type</label>
            <div className="grid grid-cols-2 p-1 bg-[var(--sunken)] rounded-[6px] gap-1">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`min-h-[36px] text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`min-h-[36px] text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  type === 'income'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Category Picker: wrap text chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label mb-0">Category</label>
              {CATEGORIES.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((prev) => !prev)}
                  className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
                >
                  {showAllCategories ? 'Show less' : 'More'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors cursor-pointer ${
                    category === cat
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                      : 'border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Segmented Control: Online / Cash */}
          <div>
            <label className="field-label">Payment method</label>
            <div className="grid grid-cols-2 p-1 bg-[var(--sunken)] rounded-[6px] gap-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`min-h-[36px] text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  paymentMethod === 'online'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`min-h-[36px] text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Date Field */}
          <div>
            <label className="field-label" htmlFor="date-input">
              Date
            </label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field text-sm"
            />
          </div>

          {/* Description / Note */}
          <div>
            <label className="field-label" htmlFor="desc-input">
              Note or description
            </label>
            <input
              id="desc-input"
              type="text"
              placeholder={`e.g. ${category} at supermarket`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field text-sm"
            />
          </div>

          {/* Historical Date Checkbox */}
          {isHistoricalDate() && (
            <div className="p-3 bg-[var(--sunken)] rounded-[6px] space-y-1">
              <label className="flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={affectCurrentBalance}
                  onChange={(e) => setAffectCurrentBalance(e.target.checked)}
                  className="rounded border-[var(--line-strong)]"
                />
                <span>Deduct from current wallet balance</span>
              </label>
              <p className="text-xs text-[var(--ink-3)]">
                Uncheck if this historical entry is already accounted for in your wallet.
              </p>
            </div>
          )}

          {/* Split with friends (Only for expense) */}
          {type === 'expense' && (
            <div className="pt-2 border-t border-[var(--line)] space-y-3">
              <label className="flex items-center justify-between text-xs font-medium text-[var(--ink)] cursor-pointer">
                <span>Split with friends</span>
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="rounded border-[var(--line-strong)]"
                />
              </label>

              {isSplit && (
                <div className="space-y-3 pt-1">
                  {loadingFriends ? (
                    <p className="text-xs text-[var(--ink-3)]">Loading friends list...</p>
                  ) : friends.length === 0 ? (
                    <p className="text-xs text-[var(--ink-3)]">
                      No friends found. Add friends in the Friends menu to split bills.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {friends.map((f) => {
                          const isSelected = splitWith.includes(f.friendId);
                          return (
                            <button
                              key={f.friendId}
                              type="button"
                              onClick={() => handleFriendToggle(f.friendId)}
                              className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                                  : 'border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
                              }`}
                            >
                              {f.displayName}
                            </button>
                          );
                        })}
                      </div>

                      {splitWith.length > 0 && (
                        <div className="p-3 bg-[var(--sunken)] rounded-[6px] space-y-2 text-xs text-[var(--ink-2)]">
                          <div className="flex items-center justify-between">
                            <span>Split mode</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSplitMode('equal')}
                                className={`text-xs ${
                                  splitMode === 'equal'
                                    ? 'text-[var(--accent)] font-semibold underline'
                                    : 'text-[var(--ink-3)]'
                                }`}
                              >
                                Equal
                              </button>
                              <button
                                type="button"
                                onClick={() => setSplitMode('custom')}
                                className={`text-xs ${
                                  splitMode === 'custom'
                                    ? 'text-[var(--accent)] font-semibold underline'
                                    : 'text-[var(--ink-3)]'
                                }`}
                              >
                                Custom
                              </button>
                            </div>
                          </div>

                          {splitMode === 'equal' && amount && (
                            <p className="text-xs text-[var(--ink-3)]">
                              ₹{(parseFloat(amount) / (splitWith.length + 1)).toFixed(2)} each (across {splitWith.length + 1} people).
                            </p>
                          )}

                          {splitMode === 'custom' && (
                            <div className="space-y-1.5 pt-1">
                              {friends
                                .filter((f) => splitWith.includes(f.friendId))
                                .map((f) => (
                                  <div key={f.friendId} className="flex items-center justify-between gap-2">
                                    <span className="text-xs truncate">{f.displayName}</span>
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="0"
                                      value={customAmounts[f.friendId] || ''}
                                      onChange={(e) =>
                                        setCustomAmounts((prev) => ({
                                          ...prev,
                                          [f.friendId]: e.target.value,
                                        }))
                                      }
                                      className="field h-8 w-24 text-xs text-right"
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Sticky Footer Action */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-end gap-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-quiet text-xs h-10 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary text-xs h-10 px-5"
          >
            {type === 'expense' ? 'Save expense' : 'Save income'}
          </button>
        </div>
      </div>
    </div>
  );
}
