import { useEffect, useRef, useState } from 'react';
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
import { LoaderCircle, Send, X } from 'lucide-react';
import { buildAssistantContext } from '../utils/aiFinanceContext';
import {
  adjustBalanceFromAssistant,
  createTransactionFromAssistant,
  deleteTransactionFromAssistant,
  setBudgetFromAssistant,
  updateTransactionFromAssistant,
} from '../utils/transactionMutations';

const DEFAULT_SUGGESTIONS = [
  'Which food am I eating overly this month?',
  'How much did I spend on sugar cane juice?',
  'What is my non veg budget this month?',
];

function createWelcomeMessage(mode) {
  return {
    id: 'welcome-message',
    role: 'assistant',
    content:
      mode === 'embedded'
        ? 'Ask me anything about your SpendWise data. I can analyze your spending and also add, edit, or delete records for you.'
        : 'I am connected to your SpendWise data and ready to help with insights, budgets, and record updates.',
    highlights: ['Live Firebase context', 'Budget aware', 'Can edit records'],
    followUps: DEFAULT_SUGGESTIONS,
  };
}

function createStatusMessage(content, tone = 'neutral') {
  return {
    id: `status-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'status',
    tone,
    content,
  };
}

export default function AiChatbot({
  mode = 'floating',
  title = 'SpendWise AI',
  subtitle = 'Live insights and actions from Firebase',
  suggestions = DEFAULT_SUGGESTIONS,
}) {
  const { currentUser } = useAuth();
  const { showError, showInfo, showSuccess } = useNotification();
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [isOpen, setIsOpen] = useState(mode === 'embedded');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [createWelcomeMessage(mode)]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (mode === 'embedded') setIsOpen(true);
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

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

    return () => { unsubscribeTransactions(); unsubscribeBudget(); unsubscribeBalances(); };
  }, [currentUser]);

  async function runAction(action) {
    switch (action.type) {
      case 'add_transaction': return createTransactionFromAssistant(currentUser.uid, action.transaction || {});
      case 'update_transaction': return updateTransactionFromAssistant(currentUser.uid, action.transactionId, action.updates || {});
      case 'delete_transaction': return deleteTransactionFromAssistant(currentUser.uid, action.transactionId);
      case 'set_budget': return setBudgetFromAssistant(currentUser.uid, action.monthlyLimit);
      case 'adjust_balance': return adjustBalanceFromAssistant(currentUser.uid, action);
      default: throw new Error(`Unsupported action type: ${action.type}`);
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

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: trimmed };
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
          context: buildAssistantContext({ transactions, budget, balances }),
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

  // ── Floating trigger ─────────────────────────────────────────────────────
  if (mode === 'floating' && !isOpen) {
    return (
      <div className="fixed bottom-6 left-4 z-50 sm:left-6">
        <button
          type="button"
          onClick={() => { setIsOpen(true); showInfo('SpendWise AI is ready with your latest Firebase data.'); }}
          className="flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 shadow-[var(--shadow-lg)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-600)] text-white">
            <img src="/logo.png" alt="SpendWise" className="h-5 w-5 object-contain" />
          </span>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold text-[var(--text-primary)]">SpendWise AI</div>
            <div className="text-xs text-[var(--text-secondary)]">Ask about spending or edit records</div>
          </div>
        </button>
      </div>
    );
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  const panelClass =
    mode === 'embedded'
      ? 'flex flex-col overflow-hidden statement-card shadow-2xl h-[640px] max-h-[calc(100vh-10rem)] p-0 border border-[var(--hairline)] bg-[var(--white)]'
      : 'fixed bottom-4 left-4 z-50 flex flex-col overflow-hidden statement-card shadow-2xl sm:bottom-6 sm:left-6 sm:h-[620px] sm:w-[420px] inset-x-3 top-20 sm:top-auto sm:inset-x-auto p-0 border border-[var(--hairline)] bg-[var(--white)]';

  return (
    <div className={panelClass}>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--navy)] text-white font-mono text-xs font-bold">
            S
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--navy)] uppercase tracking-wider">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${loadingContext ? 'animate-pulse bg-[var(--slate-light)]' : 'bg-[var(--emerald)]'}`} />
              <span className="text-[10px] font-mono text-[var(--slate-light)]">
                {loadingContext ? 'Syncing Firebase...' : subtitle}
              </span>
            </div>
          </div>
        </div>
        {mode === 'floating' && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn-statement p-1.5 rounded-md hover:border-[var(--rose)] hover:text-[var(--rose)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[var(--hairline)] bg-[var(--canvas)]/50 px-4 py-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void sendMessage(s)}
            className="btn-statement text-[10px] py-1 px-2.5 hover:border-[var(--navy)] hover:text-[var(--navy)]"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-[var(--white)]">
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isStatus = message.role === 'status';

            return (
              <div key={message.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* Bot avatar */}
                {!isUser && !isStatus && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--navy)] font-mono text-xs text-white">
                    S
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[var(--navy)] text-white font-medium shadow-sm'
                      : isStatus
                        ? message.tone === 'error'
                          ? 'border border-[var(--rose)]/30 bg-rose-50 text-[var(--rose)]'
                          : 'border border-[var(--emerald)]/30 bg-emerald-50 text-[var(--emerald-dark)]'
                        : 'border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--navy)] shadow-sm'
                  }`}
                >
                  {!isUser && !isStatus && (
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--slate-light)]">
                      Financial AI Assistant
                    </p>
                  )}

                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.highlights?.length ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {message.highlights.map((h) => (
                        <span
                          key={h}
                          className="stamp-pill text-[9px] py-0.5 px-2"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {message.followUps?.length ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {message.followUps.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => void sendMessage(f)}
                          className="btn-statement text-[9px] py-1 px-2 hover:border-[var(--emerald)] hover:text-[var(--emerald)]"
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
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--navy)] font-mono text-xs text-white">
                S
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-2.5">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--navy)]" />
                <span className="text-xs font-mono text-[var(--slate)]">Analyzing statement ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
        className="shrink-0 border-t border-[var(--hairline)] bg-[var(--canvas)] p-3"
      >
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
            }}
            placeholder="Ask AI or type a command..."
            className="input-premium py-2 px-3 text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="btn-statement-primary py-2 px-3 text-xs disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
