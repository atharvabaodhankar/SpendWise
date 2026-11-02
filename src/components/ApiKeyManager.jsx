import { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  Terminal,
  ShieldCheck,
  Code2,
  Cpu,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  generateApiKey,
  hashApiKey,
  formatKeyPrefix,
  getClaudeDesktopConfig,
  getClaudeDesktopStdioConfig,
  getCursorConfig,
  getCurlSnippet,
} from '../utils/apiKeyUtils';

export default function ApiKeyManager() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Newly created key display state (shown once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState('claude-http');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState(null);

  const loadKeys = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'apiKeys'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setKeys(items);
    } catch (err) {
      console.error('Error loading API keys:', err);
      showError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) {
      showError('Please provide a name for this API key.');
      return;
    }

    try {
      setCreating(true);
      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const prefix = formatKeyPrefix(rawKey);

      const docData = {
        userId: currentUser.uid,
        name: keyName.trim(),
        keyHash,
        prefix,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        status: 'active',
      };

      const docRef = await addDoc(collection(db, 'apiKeys'), docData);

      setKeys((prev) => [{ id: docRef.id, ...docData }, ...prev]);
      setNewlyCreatedKey({
        rawKey,
        name: keyName.trim(),
        prefix,
      });
      setKeyName('');
      setShowCreateModal(false);
      showSuccess('API Key created successfully!');
    } catch (err) {
      console.error('Error creating API key:', err);
      showError('Failed to generate API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId, name) => {
    if (!window.confirm(`Are you sure you want to revoke "${name}"? Any agent using this key will immediately lose access.`)) {
      return;
    }

    try {
      setRevokingId(keyId);
      await deleteDoc(doc(db, 'apiKeys', keyId));
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      showSuccess(`Key "${name}" revoked.`);
    } catch (err) {
      console.error('Error revoking API key:', err);
      showError('Failed to revoke API key.');
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text, type = 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
    showSuccess('Copied to clipboard!');
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const renderSnippet = () => {
    if (!newlyCreatedKey) return null;
    const { rawKey } = newlyCreatedKey;

    let content = '';
    let filename = '';

    if (activeSnippetTab === 'claude-http') {
      content = getClaudeDesktopConfig(rawKey);
      filename = 'claude_desktop_config.json (Remote URL)';
    } else if (activeSnippetTab === 'claude-stdio') {
      content = getClaudeDesktopStdioConfig(rawKey);
      filename = 'claude_desktop_config.json (Local stdio)';
    } else if (activeSnippetTab === 'cursor') {
      content = getCursorConfig(rawKey);
      filename = '.cursor/mcp.json';
    } else if (activeSnippetTab === 'curl') {
      content = getCurlSnippet(rawKey);
      filename = 'Terminal (cURL)';
    }

    return (
      <div className="space-y-2 mt-3">
        <div className="flex items-center justify-between text-[11px] text-[var(--slate-light)]">
          <span className="font-mono">{filename}</span>
          <button
            onClick={() => copyToClipboard(content, 'snippet')}
            className="flex items-center gap-1 text-[var(--navy)] hover:text-black font-semibold"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSnippet ? 'Copied Config' : 'Copy Config'}
          </button>
        </div>
        <pre className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] text-[11px] font-mono text-[var(--navy)] overflow-x-auto max-h-48 leading-relaxed">
          {content}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--navy)] flex items-center gap-2">
              Model Context Protocol (MCP) & API
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Ready
              </span>
            </h4>
            <p className="text-xs text-[var(--slate)] mt-0.5 max-w-lg leading-relaxed">
              Generate secret keys to let Claude, Cursor, Antigravity, or custom AI agents track expenses, check balances, and split bills seamlessly.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setKeyName('');
            setShowCreateModal(true);
          }}
          className="btn-statement-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Secret Key
        </button>
      </div>

      {/* Keys List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate-light)]">
            Active Secret Keys ({keys.length})
          </h5>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 border border-[var(--hairline)] rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--navy)]" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas)]">
            <Key className="w-8 h-8 text-[var(--slate-light)] mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-[var(--navy)]">No API keys created yet</p>
            <p className="text-[11px] text-[var(--slate-light)] mt-1 max-w-sm mx-auto">
              Create an API key above to connect SpendWise with your AI assistants.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--hairline)] rounded-xl overflow-hidden divide-y divide-[var(--hairline)] bg-[var(--white)]">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--canvas)]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--navy)]">{k.name}</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <ShieldCheck className="w-2.5 h-2.5" /> Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--slate-light)] font-mono">
                    <span>{k.prefix}</span>
                    <span>•</span>
                    <span>Created: {formatDate(k.createdAt)}</span>
                    <span>•</span>
                    <span>Last used: {formatDate(k.lastUsedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleRevokeKey(k.id, k.name)}
                    disabled={revokingId === k.id}
                    className="p-1.5 rounded-lg border border-[var(--hairline)] text-[var(--slate)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-colors text-xs flex items-center gap-1"
                    title="Revoke key"
                  >
                    {revokingId === k.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Revoke</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="statement-card shadow-2xl w-full max-w-md overflow-hidden p-6 border border-[var(--hairline)]">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[var(--navy)]" />
              <h3 className="text-base font-semibold text-[var(--navy)]">Generate New Secret Key</h3>
            </div>
            <p className="text-xs text-[var(--slate)] mb-4">
              Enter a descriptive label so you remember where this key is being used.
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="label-premium">Key Label</label>
                <input
                  type="text"
                  placeholder="e.g. Claude Desktop, Cursor, Personal CLI"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  autoFocus
                  required
                  className="input-premium text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] text-[11px] text-[var(--slate)] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--navy)] flex-shrink-0 mt-0.5" />
                <span>
                  SpendWise keys are hashed with SHA-256 before storage. Full secret keys are never stored plaintext in our database.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="btn-statement text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !keyName.trim()}
                  className="btn-statement-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Newly Created Key Modal (Shown once!) */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="statement-card shadow-2xl w-full max-w-xl overflow-hidden p-6 border border-[var(--hairline)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--navy)]">
                Secret Key Generated: {newlyCreatedKey.name}
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2 my-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Please copy your secret key now.</strong> For your security, you will not be able to view it again after closing this window.
              </div>
            </div>

            {/* Secret key display */}
            <div className="space-y-1.5">
              <label className="label-premium">Your Secret API Key</label>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)]">
                <code className="text-xs font-mono font-bold text-[var(--navy)] flex-1 break-all select-all">
                  {newlyCreatedKey.rawKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey.rawKey, 'key')}
                  className="btn-statement-primary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* MCP Config Snippets */}
            <div className="mt-5 pt-4 border-t border-[var(--hairline)]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--navy)] mb-2">
                <Code2 className="w-4 h-4 text-[var(--navy)]" />
                1-Click MCP Setup Config
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-[var(--hairline)] pb-1.5">
                <button
                  onClick={() => setActiveSnippetTab('claude-http')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    activeSnippetTab === 'claude-http'
                      ? 'bg-[var(--navy)] text-white font-semibold'
                      : 'text-[var(--slate)] hover:bg-[var(--canvas)]'
                  }`}
                >
                  Claude Desktop (HTTP)
                </button>
                <button
                  onClick={() => setActiveSnippetTab('claude-stdio')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    activeSnippetTab === 'claude-stdio'
                      ? 'bg-[var(--navy)] text-white font-semibold'
                      : 'text-[var(--slate)] hover:bg-[var(--canvas)]'
                  }`}
                >
                  Claude Desktop (stdio)
                </button>
                <button
                  onClick={() => setActiveSnippetTab('cursor')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    activeSnippetTab === 'cursor'
                      ? 'bg-[var(--navy)] text-white font-semibold'
                      : 'text-[var(--slate)] hover:bg-[var(--canvas)]'
                  }`}
                >
                  Cursor / Windsurf
                </button>
                <button
                  onClick={() => setActiveSnippetTab('curl')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    activeSnippetTab === 'curl'
                      ? 'bg-[var(--navy)] text-white font-semibold'
                      : 'text-[var(--slate)] hover:bg-[var(--canvas)]'
                  }`}
                >
                  cURL Test
                </button>
              </div>

              {renderSnippet()}
            </div>

            <div className="flex justify-end pt-5 mt-4 border-t border-[var(--hairline)]">
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="btn-statement-primary text-xs py-2 px-5"
              >
                I Have Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
