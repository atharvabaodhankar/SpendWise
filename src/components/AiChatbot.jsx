import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../firebase/config';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { LoaderCircle, Send, X, Trash2 } from 'lucide-react';
import { buildAssistantContext } from '../utils/aiFinanceContext';
import {
  adjustBalanceFromAssistant,
  createTransactionFromAssistant,
  deleteTransactionFromAssistant,
  setBudgetFromAssistant,
  updateTransactionFromAssistant,
} from '../utils/transactionMutations';
import {
  addInvestment,
  updateInvestment,
  deleteInvestment,
} from '../utils/investmentService';
import SpendWiseLogo from './SpendWiseLogo';

const DEFAULT_SUGGESTIONS = [
  'Which food am I eating overly this month?',
  'What is my investment portfolio value?',
  'How much did I spend on sugar cane juice?',
];

/* ── Simple Markdown renderer (bold, italic, lists, inline code) ── */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      tag === 'ol' ? (
        <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-0.5 my-1">
          {listItems.map((li, i) => <li key={i}>{formatInline(li)}</li>)}
        </ol>
      ) : (
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((li, i) => <li key={i}>{formatInline(li)}</li>)}
        </ul>
      )
    );
    listItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-*•]\s+(.*)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.*)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
    } else {
      elements.push(<p key={`p-${i}`} className="my-0.5">{formatInline(line)}</p>);
    }
  }

  flushList();
  return <>{elements}</>;
}

function formatInline(text) {
  // Process inline code, bold, italic
  const parts = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code key={match.index} className="bg-[var(--sunken)] text-[var(--ink)] px-1 py-0.5 rounded text-xs">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}

/* ── Relative time helper ── */
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── Typing dots component ── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="w-1.5 h-1.5 bg-[var(--navy)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-[var(--navy)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-[var(--navy)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function createWelcomeMessage(mode) {
  return {
    id: 'welcome-message',
    role: 'assistant',
    content:
      mode === 'embedded'
        ? 'Ask me anything about your SpendWise data. I can analyze your spending, portfolio, and also add, edit, or delete records for you.'
        : 'I am connected to your SpendWise data and ready to help with insights, budgets, investments, and record updates.',
    highlights: ['Live Firebase context', 'Budget aware', 'Investments tracking', 'Can edit records'],
    followUps: DEFAULT_SUGGESTIONS,
    timestamp: Date.now(),
  };
}

function createStatusMessage(content, tone = 'neutral') {
  return {
    id: `status-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'status',
    tone,
    content,
    timestamp: Date.now(),
  };
}

export default function AiChatbot({
  isOpen: controlledIsOpen,
  onClose,
  mode = 'floating',
  title = 'SpendWise AI',
  subtitle = 'Live insights and actions from Firebase',
  suggestions = DEFAULT_SUGGESTIONS,
}) {
  const { currentUser } = useAuth();
  const { showError = () => {}, showSuccess = () => {} } = useNotification() || {};
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [balances, setBalances] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [internalIsOpen, setInternalIsOpen] = useState(mode === 'embedded');
  const isControlled = controlledIsOpen !== undefined;
  const isPanelOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (!isControlled) setInternalIsOpen(false);
  }, [onClose, isControlled]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [createWelcomeMessage(mode)]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (mode === 'embedded') setInternalIsOpen(true);
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 4 * 20; // ~4 lines
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  useEffect(() => {
    if (!currentUser) return undefined;
    setLoadingContext(true);

    const unsubscribeTransactions = onSnapshot(
      query(collection(db, 'transactions'), where('userId', '==', currentUser.uid), orderBy('date', 'desc')),
      (snapshot) => {
        setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingContext(false);
      },
      () => setLoadingContext(false),
    );

    const unsubscribeBudget = onSnapshot(doc(db, 'budgets', currentUser.uid), (s) =>
      setBudget(s.exists() ? s.data() : null),
    );

    const unsubscribeBalances = onSnapshot(doc(db, 'currentBalances', currentUser.uid), (s) =>
      setBalances(s.exists() ? s.data() : null),
    );

    const unsubscribeInvestments = onSnapshot(
      query(collection(db, 'investments'), where('userId', '==', currentUser.uid)),
      (snapshot) => {
        setInvestments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.warn('Failed to subscribe to investments:', error);
      },
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBudget();
      unsubscribeBalances();
      unsubscribeInvestments();
    };
  }, [currentUser]);

  async function runAction(action) {
    switch (action.type) {
      case 'add_transaction':
        return createTransactionFromAssistant(currentUser.uid, action.transaction || {});
      case 'update_transaction':
        return updateTransactionFromAssistant(currentUser.uid, action.transactionId, action.updates || {});
      case 'delete_transaction':
        return deleteTransactionFromAssistant(currentUser.uid, action.transactionId);
      case 'set_budget':
        return setBudgetFromAssistant(currentUser.uid, action.monthlyLimit);
      case 'adjust_balance':
        return adjustBalanceFromAssistant(currentUser.uid, action);
      case 'add_investment': {
        const invData = {
          assetType: action.assetType,
          name: action.name,
          provider: action.provider,
          investedAmount: action.investedAmount,
          currentValue: action.currentValue,
          purchaseDate: action.purchaseDate,
          maturityDate: action.maturityDate,
          interestRate: action.interestRate,
          units: action.units,
          notes: action.notes,
          ...(action.investment || {}),
        };
        return addInvestment(currentUser.uid, invData);
      }
      case 'update_investment': {
        let investmentId = action.investmentId || action.id;
        if (!investmentId && (action.name || action.updates?.name)) {
          const targetName = (action.name || action.updates?.name || '').trim().toLowerCase();
          const match = investments.find(
            (inv) => inv.name?.trim().toLowerCase() === targetName,
          );
          if (match) {
            investmentId = match.id;
          }
        }
        if (!investmentId) {
          throw new Error('Investment ID could not be identified for update.');
        }
        const updates = {
          ...(action.updates || {}),
          ...(action.assetType !== undefined ? { assetType: action.assetType } : {}),
          ...(action.name !== undefined ? { name: action.name } : {}),
          ...(action.provider !== undefined ? { provider: action.provider } : {}),
          ...(action.investedAmount !== undefined ? { investedAmount: action.investedAmount } : {}),
          ...(action.currentValue !== undefined ? { currentValue: action.currentValue } : {}),
          ...(action.purchaseDate !== undefined ? { purchaseDate: action.purchaseDate } : {}),
          ...(action.maturityDate !== undefined ? { maturityDate: action.maturityDate } : {}),
          ...(action.interestRate !== undefined ? { interestRate: action.interestRate } : {}),
          ...(action.units !== undefined ? { units: action.units } : {}),
          ...(action.notes !== undefined ? { notes: action.notes } : {}),
          ...(action.investment || {}),
        };
        return updateInvestment(currentUser.uid, investmentId, updates);
      }
      case 'delete_investment': {
        let investmentId = action.investmentId || action.id;
        if (!investmentId && action.name) {
          const targetName = action.name.trim().toLowerCase();
          const match = investments.find(
            (inv) => inv.name?.trim().toLowerCase() === targetName,
          );
          if (match) {
            investmentId = match.id;
          }
        }
        if (!investmentId) {
          throw new Error('Investment ID could not be identified for deletion.');
        }
        return deleteInvestment(currentUser.uid, investmentId);
      }
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  async function executeActions(actions) {
    if (!actions.length) return;
    const outcomes = [];
    for (const action of actions) {
      try {
        const result = await runAction(action);
        outcomes.push(result.message);
      } catch (error) {
        outcomes.push(`Could not finish ${action.type.replaceAll('_', ' ')}: ${error.message}`);
      }
    }
    const hasError = outcomes.some((o) => o.startsWith('Could not'));
    setMessages((prev) => [...prev, createStatusMessage(outcomes.join(' '), hasError ? 'error' : 'success')]);
    if (hasError) showError('Some requested AI actions could not be completed.');
    else showSuccess('SpendWise AI finished the requested updates.');
  }

  async function sendMessage(messageText) {
    const trimmed = messageText.trim();
    if (!trimmed || !currentUser || isSending) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: trimmed, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          conversation: nextMessages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
          context: buildAssistantContext({ transactions, budget, balances, investments }),
        }),
      });
      clearTimeout(timeoutId);

      const raw = await response.text();
      let payload = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch {
        throw new Error(response.ok ? 'Unreadable response from AI server.' : `Server returned status ${response.status}. Make sure vercel dev is running.`);
      }
      if (!response.ok) throw new Error(payload.error || payload.details || 'AI request failed.');

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload.reply,
          highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
          followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
          timestamp: Date.now(),
        },
      ]);

      if (payload.actions?.length) await executeActions(payload.actions);
    } catch (error) {
      console.error('SpendWise AI error:', error);
      const isAbort = error.name === 'AbortError';
      const msg = isAbort
        ? 'AI request timed out. Please ensure vercel dev is running.'
        : (error.message || 'SpendWise AI could not finish that request right now.');
      setMessages((prev) => [
        ...prev,
        createStatusMessage(msg, 'error'),
      ]);
      showError(msg);
    } finally {
      setIsSending(false);
    }
  }

  function clearConversation() {
    setMessages([createWelcomeMessage(mode)]);
  }

  // ── Drawer mode ──────────────────────────────────────────────────────────
  if (mode === 'drawer') {
    if (!isPanelOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div
          className="relative z-10 w-full sm:w-[420px] bg-[var(--surface)] border-l border-[var(--line)] shadow-2xl flex flex-col h-full max-sm:h-[88dvh] max-sm:mt-auto max-sm:rounded-t-[14px] max-sm:border-t max-sm:border-l-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <SpendWiseLogo size={28} />
              <div>
                <p className="text-xs font-semibold text-[var(--ink)]">{title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${loadingContext ? 'animate-pulse bg-[var(--ink-3)]' : 'bg-[var(--credit)]'}`} />
                  <span className="text-xs text-[var(--ink-3)]">
                    {loadingContext ? 'Syncing Firebase...' : subtitle}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={clearConversation}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-[6px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close chat"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[6px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[var(--line)] bg-[var(--sunken)] px-4 py-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void sendMessage(s)}
                className="text-xs py-1 px-2.5 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages — scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-[var(--surface)]">
            <div className="flex flex-col gap-3">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const isStatus = message.role === 'status';

                return (
                  <div key={message.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && !isStatus && (
                      <div className="mt-0.5 flex-shrink-0">
                        <SpendWiseLogo size={24} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-[14px] px-4 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[var(--accent-soft)] text-[var(--ink)] border border-[var(--accent)]/20'
                          : isStatus
                            ? message.tone === 'error'
                              ? 'border border-[var(--debit)]/30 bg-[var(--sunken)] text-[var(--debit)]'
                              : 'border border-[var(--credit)]/30 bg-[var(--sunken)] text-[var(--credit)]'
                            : 'border border-[var(--line)] bg-[var(--sunken)] text-[var(--ink)]'
                      }`}
                    >
                      {!isUser && !isStatus && (
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-[var(--ink-2)]">
                            SpendWise Assistant
                          </p>
                          <span className="text-xs text-[var(--ink-3)]">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      <div className="break-words font-sans">
                        {renderMarkdown(message.content)}
                      </div>

                      {message.highlights?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-[var(--line)] pt-2">
                          {message.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--ink-2)] border border-[var(--line)]"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {message.followUps?.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-1 border-t border-[var(--line)] pt-2">
                          <p className="text-xs font-medium text-[var(--ink-2)]">Suggestions</p>
                          <div className="flex flex-wrap gap-1">
                            {message.followUps.map((f, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => void sendMessage(f)}
                                className="rounded-[4px] border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors text-left"
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isSending && (
                <div className="flex items-center gap-2 text-xs text-[var(--ink-3)] px-2">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !isSending) {
                void sendMessage(input);
                setInput('');
              }
            }}
            className="shrink-0 border-t border-[var(--line)] bg-[var(--surface)] p-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isSending) {
                      sendMessage(input);
                      setInput('');
                    }
                  }
                }}
                rows={1}
                placeholder="Ask SpendWise..."
                className="w-full resize-none rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] px-3 py-2 pr-10 text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-2)] hover:text-[var(--accent)] disabled:opacity-40 transition-colors"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Floating trigger ─────────────────────────────────────────────────────
  if (mode === 'floating' && !isPanelOpen) {
    return (
      <div className="fixed bottom-6 left-4 z-50 sm:left-6">
        <button
          type="button"
          onClick={() => { setInternalIsOpen(true); }}
          className="flex items-center gap-3 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 sm:px-4 py-2 sm:py-2.5 shadow-[var(--shadow-pop)] transition-colors hover:bg-[var(--sunken)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[4px] overflow-hidden">
            <SpendWiseLogo size={32} />
          </span>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-[var(--ink)]">SpendWise AI</div>
            <div className="text-xs text-[var(--ink-3)]">Ask about spending or edit records</div>
          </div>
        </button>
      </div>
    );
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  const panelClass =
    mode === 'embedded'
      ? 'flex flex-col overflow-hidden shadow-[var(--shadow-pop)] h-[580px] sm:h-[640px] max-h-[calc(100vh-10rem)] p-0 border border-[var(--line)] bg-[var(--surface)]'
      : 'fixed bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-pop)] sm:bottom-6 sm:left-6 sm:right-auto sm:h-[620px] sm:w-[420px] sm:rounded-[14px] sm:border sm:border-[var(--line)] p-0';

  return (
    <div className={panelClass}>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--sunken)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <SpendWiseLogo size={28} />
          <div>
            <p className="text-xs font-semibold text-[var(--ink)]">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${loadingContext ? 'animate-pulse bg-[var(--ink-3)]' : 'bg-[var(--credit)]'}`} />
              <span className="text-xs text-[var(--ink-3)]">
                {loadingContext ? 'Syncing...' : subtitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearConversation}
            className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)]"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {mode === 'floating' && (
            <button
              type="button"
              onClick={handleClose}
              className="btn-quiet p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[var(--line)] bg-[var(--sunken)] px-4 py-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void sendMessage(s)}
            className="btn-secondary text-xs py-1 px-2"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 bg-[var(--surface)]">
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isStatus = message.role === 'status';

            return (
              <div key={message.id} className={`flex gap-2 sm:gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && !isStatus && (
                  <div className="mt-0.5 flex-shrink-0">
                    <SpendWiseLogo size={24} />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[var(--accent-soft)] text-[var(--ink)] border border-[var(--accent)]/20'
                      : isStatus
                        ? message.tone === 'error'
                          ? 'border border-[var(--debit)]/30 bg-[var(--sunken)] text-[var(--debit)]'
                          : 'border border-[var(--credit)]/30 bg-[var(--sunken)] text-[var(--credit)]'
                        : 'border border-[var(--line)] bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                >
                  {!isUser && !isStatus && (
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-[var(--ink-2)]">
                        SpendWise Assistant
                      </p>
                      {message.timestamp && (
                        <span className="text-xs text-[var(--ink-3)] ml-2">
                          {timeAgo(message.timestamp)}
                        </span>
                      )}
                    </div>
                  )}

                  {isUser && message.timestamp && (
                    <div className="flex justify-end mb-1">
                      <span className="text-xs text-[var(--ink-3)]">
                        {timeAgo(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">
                    {isUser ? message.content : renderMarkdown(message.content)}
                  </div>

                  {message.highlights?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-[4px] bg-[var(--surface)] px-1.5 py-0.5 text-xs text-[var(--ink-2)] border border-[var(--line)]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {message.followUps?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.followUps.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => void sendMessage(f)}
                          className="btn-secondary text-xs py-0.5 px-2"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <SpendWiseLogo size={24} />
              </div>
              <div className="flex items-center gap-2 rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] px-3 py-2">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
        className="shrink-0 border-t border-[var(--line)] bg-[var(--surface)] p-2.5 sm:p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
            }}
            placeholder="Ask AI or type a command..."
            className="input-base py-2 px-3 text-xs resize-none overflow-hidden flex-1"
            style={{ minHeight: '36px', maxHeight: '80px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="btn-primary py-2 px-3 text-xs disabled:opacity-40 flex-shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
