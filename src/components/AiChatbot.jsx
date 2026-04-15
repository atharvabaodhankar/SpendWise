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
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
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
    highlights: [
      'Live Firebase-backed context',
      'Budget and balance aware',
      'Can add, edit, and delete records',
    ],
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
    if (mode === 'embedded') {
      setIsOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    setLoadingContext(true);

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc'),
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const nextTransactions = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setTransactions(nextTransactions);
        setLoadingContext(false);
      },
      () => setLoadingContext(false),
    );

    const unsubscribeBudget = onSnapshot(doc(db, 'budgets', currentUser.uid), (snapshot) => {
      setBudget(snapshot.exists() ? snapshot.data() : null);
    });

    const unsubscribeBalances = onSnapshot(
      doc(db, 'currentBalances', currentUser.uid),
      (snapshot) => {
        setBalances(snapshot.exists() ? snapshot.data() : null);
      },
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBudget();
      unsubscribeBalances();
    };
  }, [currentUser]);

  async function runAction(action) {
    switch (action.type) {
      case 'add_transaction':
        return createTransactionFromAssistant(currentUser.uid, action.transaction || {});
      case 'update_transaction':
        return updateTransactionFromAssistant(
          currentUser.uid,
          action.transactionId,
          action.updates || {},
        );
      case 'delete_transaction':
        return deleteTransactionFromAssistant(currentUser.uid, action.transactionId);
      case 'set_budget':
        return setBudgetFromAssistant(currentUser.uid, action.monthlyLimit);
      case 'adjust_balance':
        return adjustBalanceFromAssistant(currentUser.uid, action);
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  async function executeActions(actions) {
    if (!actions.length) {
      return;
    }

    const outcomes = [];

    for (const action of actions) {
      try {
        const result = await runAction(action);
        outcomes.push(result.message);
      } catch (error) {
        outcomes.push(`Could not finish ${action.type.replaceAll('_', ' ')}: ${error.message}`);
      }
    }

    setMessages((prev) => [
      ...prev,
      createStatusMessage(outcomes.join(' '), outcomes.some((item) => item.startsWith('Could not')) ? 'error' : 'success'),
    ]);

    if (outcomes.some((item) => item.startsWith('Could not'))) {
      showError('Some requested AI actions could not be completed.');
    } else {
      showSuccess('SpendWise AI finished the requested updates.');
    }
  }

  async function sendMessage(messageText) {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !currentUser || isSending) {
      return;
    }

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const assistantContext = buildAssistantContext({
        transactions,
        budget,
        balances,
      });

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversation: nextMessages
            .filter((item) => item.role === 'user' || item.role === 'assistant')
            .map((item) => ({ role: item.role, content: item.content })),
          context: assistantContext,
        }),
      });

      const rawResponse = await response.text();
      let payload = {};

      try {
        payload = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          response.ok
            ? 'SpendWise AI returned an unreadable response.'
            : `SpendWise AI request failed with ${response.status}.`,
        );
      }

      if (!response.ok) {
        throw new Error(payload.error || payload.details || 'AI request failed.');
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.reply,
        highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
        followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (payload.actions?.length) {
        await executeActions(payload.actions);
      }
    } catch (error) {
      console.error('SpendWise AI error:', error);
      setMessages((prev) => [
        ...prev,
        createStatusMessage(
          error.message || 'SpendWise AI could not finish that request right now.',
          'error',
        ),
      ]);
      showError(error.message || 'SpendWise AI could not finish that request right now.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void sendMessage(input);
  }

  const containerClassName =
    mode === 'embedded'
      ? 'premium-card overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] h-[720px] max-h-[calc(100vh-10rem)]'
      : isOpen
        ? 'fixed inset-x-3 bottom-3 top-20 z-[70] flex flex-col premium-card border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl sm:top-auto sm:left-6 sm:right-auto sm:bottom-6 sm:h-[680px] sm:w-[420px]'
        : '';

  if (mode === 'floating' && !isOpen) {
    return (
      <div className="fixed bottom-6 left-4 z-[70] sm:left-6">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            showInfo('SpendWise AI is ready with your latest Firebase data.');
          }}
          className="group flex items-center gap-3 rounded-full border border-[var(--card-border)] bg-[var(--primary-900)] px-4 py-3 text-white shadow-xl transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-800)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
            <Bot className="h-5 w-5" />
          </span>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold">SpendWise AI</div>
            <div className="text-xs text-white/75">Ask about spending or edit records</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--primary-900)]/55 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)] text-[var(--accent-300)] shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] sm:text-base">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>{loadingContext ? 'Syncing Firebase...' : subtitle}</span>
            </div>
          </div>
        </div>

        {mode === 'floating' ? (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--primary-800)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="hidden items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] sm:inline-flex">
            <Wallet className="h-3.5 w-3.5" />
            Analytics copilot
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-[var(--bg-secondary)]">
        <div className="flex flex-wrap gap-2 border-b border-[var(--card-border)] bg-[var(--primary-950)]/35 px-4 py-3 sm:px-5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="rounded-full border border-[var(--card-border)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-500)] hover:bg-[var(--primary-800)] hover:text-[var(--text-primary)]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isStatus = message.role === 'status';

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[85%] ${
                    isUser
                      ? 'border border-[var(--accent-700)] bg-[var(--accent-600)] text-white'
                      : isStatus
                        ? message.tone === 'error'
                          ? 'border border-rose-900/70 bg-rose-950/70 text-rose-100'
                          : 'border border-emerald-900/70 bg-emerald-950/60 text-emerald-100'
                        : 'border border-[var(--card-border)] bg-[var(--primary-900)]/55 text-[var(--text-primary)]'
                  }`}
                >
                  {!isUser && !isStatus ? (
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Assistant
                    </div>
                  ) : null}

                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                  {message.highlights?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-[var(--card-border)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {message.followUps?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.followUps.map((followUp) => (
                        <button
                          key={followUp}
                          type="button"
                          onClick={() => void sendMessage(followUp)}
                          className="rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--accent-300)] transition-colors hover:border-[var(--accent-500)] hover:bg-[var(--primary-800)] hover:text-white"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {isSending ? (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] items-center gap-3 rounded-3xl border border-[var(--card-border)] bg-[var(--primary-900)]/55 px-4 py-3 text-sm text-[var(--text-secondary)]">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Thinking with your SpendWise data...
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[var(--card-border)] bg-[var(--primary-900)]/45 p-4 sm:p-5">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Ask about spending trends or tell me to add, edit, or delete a record..."
              className="input-premium min-h-[56px] resize-none"
              disabled={isSending || loadingContext}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <button
              type="submit"
              disabled={isSending || loadingContext || !input.trim()}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-600)] text-white shadow-lg shadow-blue-950/40 transition-colors hover:bg-[var(--accent-500)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            The assistant answers from your live Firebase data and can update your records when your request is clear.
          </p>
        </form>
      </div>
    </div>
  );
}
