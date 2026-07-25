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

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation: nextMessages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
          context: buildAssistantContext({ transactions, budget, balances }),
        }),
      });

      const raw = await response.text();
      let payload = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch {
        throw new Error(response.ok ? 'Unreadable response.' : `Request failed with ${response.status}.`);
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
      setMessages((prev) => [
        ...prev,
        createStatusMessage(error.message || 'SpendWise AI could not finish that request right now.', 'error'),
      ]);
      showError(error.message || 'SpendWise AI could not finish that request right now.');
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
      ? 'flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#171f33]/70 backdrop-blur-2xl shadow-2xl h-[680px] max-h-[calc(100vh-10rem)]'
      : 'fixed bottom-4 left-4 z-50 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#171f33]/85 backdrop-blur-3xl shadow-2xl sm:bottom-6 sm:left-6 sm:h-[640px] sm:w-[420px] inset-x-3 top-20 sm:top-auto sm:inset-x-auto border-[#10b981]/30';

  return (
    <div className={panelClass}>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b1326]/80 backdrop-blur-2xl px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#10b981]/20 to-[#6366f1]/20 border border-white/10 text-white shadow-lg shadow-[#10b981]/10">
            <img src="/logo.png" alt="SpendWise" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: 'Geist, sans-serif' }}>{title}</p>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${loadingContext ? 'animate-pulse bg-[#94a3b8]' : 'bg-[#10b981] shadow-[0_0_8px_#10b981]'}`} />
              <span className="text-[11px] text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                {loadingContext ? 'Syncing Firebase...' : subtitle}
              </span>
            </div>
          </div>
        </div>
        {mode === 'floating' && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#94a3b8] transition-all hover:text-white hover:bg-white/10 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-white/10 bg-[#0b1326]/50 px-4 py-2.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void sendMessage(s)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#94a3b8] transition-all duration-150 hover:border-[#10b981]/40 hover:bg-[#10b981]/15 hover:text-[#10b981] active:scale-95"
            style={{ fontFamily: 'Geist, sans-serif' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isStatus = message.role === 'status';

            return (
              <div key={message.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* Bot avatar */}
                {!isUser && !isStatus && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/15 text-white">
                    <img src="/logo.png" alt="SpendWise" className="h-4 w-4 object-contain" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg shadow-[#10b981]/20 font-medium'
                      : isStatus
                        ? message.tone === 'error'
                          ? 'border border-[#f43f5e]/30 bg-[#f43f5e]/15 text-[#f43f5e]'
                          : 'border border-[#10b981]/30 bg-[#10b981]/15 text-[#10b981]'
                        : 'border border-white/10 bg-[#0b1326]/70 text-[#f8fafc]'
                  }`}
                >
                  {!isUser && !isStatus && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Financial AI Assistant
                    </p>
                  )}

                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.highlights?.length ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {message.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-[#94a3b8]"
                          style={{ fontFamily: 'Geist, sans-serif' }}
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
                          className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-1 text-[11px] text-[#10b981] transition-all duration-150 hover:bg-[#10b981]/25 active:scale-95"
                          style={{ fontFamily: 'Geist, sans-serif' }}
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#10b981]/30 bg-[#10b981]/15 text-white">
                <img src="/logo.png" alt="SpendWise" className="h-4 w-4 object-contain" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1326]/70 px-4 py-3">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#10b981]" />
                <span className="text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>Analyzing ledger...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
        className="shrink-0 border-t border-white/10 bg-[#0b1326]/80 backdrop-blur-2xl p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
            }}
            disabled={isSending || loadingContext}
            placeholder="Ask AI or type a command..."
            className="input-premium min-h-[42px] flex-1 resize-none py-2.5 text-sm bg-[#0b1326] text-white"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            type="submit"
            disabled={isSending || loadingContext || !input.trim()}
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-[#10b981]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
