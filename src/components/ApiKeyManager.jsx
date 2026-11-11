import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  Code2,
  Terminal,
  Layers,
  Search,
  ArrowRight,
  FolderOpen,
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
  getEffectiveApiUrl,
  getClaudeDesktopConfig,
  getClaudeDesktopStdioConfig,
  getCursorConfig,
  getAntigravityConfig,
  getWindsurfConfig,
  getCurlSnippet,
  getPythonSnippet,
  CLIENT_CONFIG_PATHS,
  SPENDWISE_MCP_TOOLS_CATALOG,
} from '../utils/apiKeyUtils';

const FIRESTORE_RULE_SNIPPET = `    // API Keys collection - users can manage their own API keys
    match /apiKeys/{keyId} {
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
    }`;

export default function ApiKeyManager() {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const showSuccess = notification?.showSuccess || (() => {});
  const showError = notification?.showError || (() => {});

  // Top-level subtab: 'keys' | 'setup' | 'tools'
  const [managerTab, setManagerTab] = useState('keys');

  // Keys state
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rulesNeeded, setRulesNeeded] = useState(false);

  // Newly created key display state
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedModalSnippet, setCopiedModalSnippet] = useState(false);
  const [modalSnippetClient, setModalSnippetClient] = useState('claude-http');

  // Setup tab state
  const [selectedClient, setSelectedClient] = useState('claude-http');
  const [selectedOs, setSelectedOs] = useState('windows');
  const [copiedSetupSnippet, setCopiedSetupSnippet] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Tools tab state
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategory, setToolCategory] = useState('all');
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);

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
      setRulesNeeded(false);
    } catch (err) {
      console.error('Error loading API keys:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        String(err?.message || err).toLowerCase().includes('insufficient permissions');
      if (isPermissionDenied) {
        setRulesNeeded(true);
      } else {
        showError('Failed to load API keys.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadKeys();
    }
  }, [currentUser?.uid, loadKeys]);

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
      showSuccess('API key generated successfully. Save it now.');
    } catch (err) {
      console.error('Error creating API key:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        String(err?.message || err).toLowerCase().includes('insufficient permissions');
      if (isPermissionDenied) {
        setRulesNeeded(true);
        showError('Firestore permission denied: Update rules in Firebase Console.');
      } else {
        showError('Failed to generate API key.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId, name) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke "${name}"? Any client using this key will lose access immediately.`
      )
    ) {
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

  const copyToClipboard = (text, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard.`);
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

  const displayApiKey = newlyCreatedKey ? newlyCreatedKey.rawKey : 'spw_live_YOUR_SECRET_KEY';
  const effectiveApiUrl = getEffectiveApiUrl();

  const getSnippetForClient = (clientId, keyToUse) => {
    switch (clientId) {
      case 'claude-http':
        return getClaudeDesktopConfig(keyToUse, effectiveApiUrl);
      case 'cursor':
        return getCursorConfig(keyToUse, effectiveApiUrl);
      case 'claude-stdio':
        return getClaudeDesktopStdioConfig(keyToUse, effectiveApiUrl);
      case 'antigravity':
        return getAntigravityConfig(keyToUse, effectiveApiUrl);
      case 'windsurf':
        return getWindsurfConfig(keyToUse, effectiveApiUrl);
      case 'curl':
        return getCurlSnippet(keyToUse, effectiveApiUrl);
      case 'python':
        return getPythonSnippet(keyToUse, effectiveApiUrl);
      default:
        return getClaudeDesktopConfig(keyToUse, effectiveApiUrl);
    }
  };

  const categories = useMemo(() => {
    const cats = ['all'];
    SPENDWISE_MCP_TOOLS_CATALOG.forEach((t) => {
      if (!cats.includes(t.category)) cats.push(t.category);
    });
    return cats;
  }, []);

  const filteredTools = useMemo(() => {
    return SPENDWISE_MCP_TOOLS_CATALOG.filter((tool) => {
      const matchesCat = toolCategory === 'all' || tool.category === toolCategory;
      const q = toolSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.summary.toLowerCase().includes(q) ||
        tool.example.toLowerCase().includes(q) ||
        tool.params.some((p) => p.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [toolSearch, toolCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h3 className="text-[17px] font-semibold text-[var(--ink)]">
            Model Context Protocol (MCP) and API keys
          </h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
            Connect SpendWise to Claude Desktop, Cursor, Antigravity, or custom agents with SHA-256 hashed keys.
          </p>
        </div>

        <button
          onClick={() => {
            setKeyName('');
            setShowCreateModal(true);
          }}
          className="btn-primary self-start sm:self-auto text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create secret key
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[var(--line)]">
        <button
          onClick={() => setManagerTab('keys')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            managerTab === 'keys'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Secret keys ({keys.length})
        </button>

        <button
          onClick={() => setManagerTab('setup')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            managerTab === 'setup'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Setup guides
        </button>

        <button
          onClick={() => setManagerTab('tools')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            managerTab === 'tools'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Tool catalog ({SPENDWISE_MCP_TOOLS_CATALOG.length})
        </button>
      </div>

      {/* Firebase Rules Alert */}
      {rulesNeeded && (
        <div className="p-3.5 rounded-[6px] border border-[var(--debit)]/30 bg-[var(--sunken)] text-xs text-[var(--ink)] space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--debit)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[var(--ink)]">
                  Firebase security rule update needed
                </p>
                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                  Firestore blocked access to apiKeys because the security rule is pending in Firebase Console.
                </p>
              </div>
            </div>
            <button
              onClick={loadKeys}
              className="btn-secondary text-xs py-1 px-2.5 flex-shrink-0"
            >
              Retry
            </button>
          </div>

          <pre className="p-2.5 rounded-[6px] bg-[var(--bg)] border border-[var(--line)] text-xs font-mono overflow-x-auto text-[var(--ink)]">
            {FIRESTORE_RULE_SNIPPET}
          </pre>
        </div>
      )}

      {/* Newly Created Key Alert (shown once) */}
      {newlyCreatedKey && (
        <div className="p-4 rounded-[6px] bg-[var(--sunken)] border border-[var(--line-strong)] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[var(--ink)]">
                Secret key generated: {newlyCreatedKey.name}
              </p>
              <p className="text-xs text-[var(--debit)] mt-0.5">
                Copy this key now. You won&apos;t see it again.
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="btn-quiet text-xs py-1 px-2"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2">
            <code className="text-xs font-mono px-2.5 py-1.5 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] flex-1 break-all select-all">
              {newlyCreatedKey.rawKey}
            </code>
            <button
              onClick={() => {
                copyToClipboard(newlyCreatedKey.rawKey, 'Secret key');
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Quick config preview */}
          <div className="pt-2 border-t border-[var(--line)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)] font-medium">
                Client config preview
              </span>
              <button
                onClick={() => {
                  const snippet = getSnippetForClient(modalSnippetClient, newlyCreatedKey.rawKey);
                  copyToClipboard(snippet, 'Configuration');
                  setCopiedModalSnippet(true);
                  setTimeout(() => setCopiedModalSnippet(false), 2000);
                }}
                className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                {copiedModalSnippet ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedModalSnippet ? 'Copied' : 'Copy config'}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[
                { id: 'claude-http', label: 'Claude Desktop' },
                { id: 'cursor', label: 'Cursor' },
                { id: 'antigravity', label: 'Antigravity' },
                { id: 'curl', label: 'cURL' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setModalSnippetClient(c.id)}
                  className={`text-xs px-2 py-0.5 rounded-[6px] transition-colors ${
                    modalSnippetClient === c.id
                      ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                      : 'text-[var(--ink-2)] hover:bg-[var(--surface)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <pre className="p-3 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] text-xs font-mono text-[var(--ink)] overflow-x-auto max-h-36">
              {getSnippetForClient(modalSnippetClient, newlyCreatedKey.rawKey)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 1: KEYS LIST */}
      {managerTab === 'keys' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 px-4 border border-[var(--line)] rounded-[6px] bg-[var(--surface)] space-y-3">
              <Key className="w-6 h-6 text-[var(--ink-3)] mx-auto opacity-60" />
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">No secret keys generated yet</p>
                <p className="text-xs text-[var(--ink-3)] mt-1 max-w-sm mx-auto">
                  Create a secret key to authenticate your MCP agent or client.
                </p>
              </div>
              <button
                onClick={() => {
                  setKeyName('');
                  setShowCreateModal(true);
                }}
                className="btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Create secret key
              </button>
            </div>
          ) : (
            <div className="border border-[var(--line)] rounded-[6px] overflow-hidden bg-[var(--surface)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--sunken)] border-b border-[var(--line)] text-[var(--ink-3)]">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Name</th>
                      <th className="py-2.5 px-3 font-medium">Key</th>
                      <th className="py-2.5 px-3 font-medium">Created</th>
                      <th className="py-2.5 px-3 font-medium">Last used</th>
                      <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-[var(--sunken)]/40 transition-colors">
                        <td className="py-3 px-3 font-medium text-[var(--ink)]">
                          {k.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--ink-2)]">
                          {k.prefix}••••••••
                        </td>
                        <td className="py-3 px-3 text-[var(--ink-3)]">
                          {formatDate(k.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-[var(--ink-3)]">
                          {formatDate(k.lastUsedAt)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRevokeKey(k.id, k.name)}
                            disabled={revokingId === k.id}
                            className="btn-danger text-xs py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
                          >
                            {revokingId === k.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3" />
                                <span>Revoke</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Setup link */}
          <div className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--ink)]">
                Ready to configure your AI assistant?
              </p>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                Switch to the setup guides for exact file locations and JSON configs.
              </p>
            </div>
            <button
              onClick={() => setManagerTab('setup')}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
            >
              Setup guides <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT SETUP GUIDES */}
      {managerTab === 'setup' && (
        <div className="space-y-5">
          {/* Client Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--ink-3)]">
              Select your AI client
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'claude-http', label: 'Claude Desktop (HTTP)' },
                { id: 'cursor', label: 'Cursor' },
                { id: 'antigravity', label: 'Google Antigravity' },
                { id: 'windsurf', label: 'Windsurf' },
                { id: 'claude-stdio', label: 'Claude (stdio)' },
                { id: 'curl', label: 'cURL' },
                { id: 'python', label: 'Python script' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-[6px] border transition-colors cursor-pointer ${
                    selectedClient === c.id
                      ? 'bg-[var(--accent)] text-[var(--on-accent)] border-[var(--accent)]'
                      : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Config file path card */}
          {['claude-http', 'claude-stdio', 'cursor', 'antigravity', 'windsurf'].includes(selectedClient) && (
            <div className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink)]">
                  <FolderOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Configuration file location</span>
                </div>

                {/* OS Switcher */}
                <div className="flex items-center gap-1 bg-[var(--sunken)] p-0.5 rounded-[6px]">
                  {['windows', 'macos', 'linux'].map((os) => (
                    <button
                      key={os}
                      onClick={() => setSelectedOs(os)}
                      className={`text-xs px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer ${
                        selectedOs === os
                          ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-xs'
                          : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {os === 'macos' ? 'macOS' : os === 'windows' ? 'Windows' : 'Linux'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)]">
                <code className="text-xs font-mono text-[var(--ink)] flex-1 overflow-x-auto whitespace-nowrap">
                  {CLIENT_CONFIG_PATHS[
                    selectedClient.startsWith('claude')
                      ? 'claude'
                      : selectedClient === 'antigravity'
                      ? 'antigravity'
                      : selectedClient === 'windsurf'
                      ? 'windsurf'
                      : 'cursor'
                  ]?.[selectedOs] || 'Config file'}
                </code>
                <button
                  onClick={() => {
                    const p =
                      CLIENT_CONFIG_PATHS[
                        selectedClient.startsWith('claude')
                          ? 'claude'
                          : selectedClient === 'antigravity'
                          ? 'antigravity'
                          : selectedClient === 'windsurf'
                          ? 'windsurf'
                          : 'cursor'
                      ]?.[selectedOs];
                    copyToClipboard(p, 'Path');
                    setCopiedPath(true);
                    setTimeout(() => setCopiedPath(false), 2000);
                  }}
                  className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 flex-shrink-0"
                >
                  {copiedPath ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedPath ? 'Copied' : 'Copy path'}
                </button>
              </div>
            </div>
          )}

          {/* Config Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--ink)] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                Configuration snippet
              </span>
              <button
                onClick={() => {
                  const snippet = getSnippetForClient(selectedClient, displayApiKey);
                  copyToClipboard(snippet, 'Configuration');
                  setCopiedSetupSnippet(true);
                  setTimeout(() => setCopiedSetupSnippet(false), 2000);
                }}
                className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                {copiedSetupSnippet ? (
                  <>
                    <Check className="w-3 h-3" /> Copied config
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy config
                  </>
                )}
              </button>
            </div>

            <div className="rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] overflow-hidden">
              <pre className="p-3.5 text-xs font-mono text-[var(--ink)] overflow-x-auto max-h-72 leading-relaxed">
                {getSnippetForClient(selectedClient, displayApiKey)}
              </pre>
            </div>

            {!newlyCreatedKey && (
              <p className="text-xs text-[var(--ink-3)]">
                Replace <code>spw_live_YOUR_SECRET_KEY</code> with your real key from the Secret keys tab.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TOOL CATALOG */}
      {managerTab === 'tools' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input
              type="text"
              placeholder="Search tools by name or description..."
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              className="input-base pl-8 text-xs w-full py-1.5"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setToolCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-[6px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  toolCategory === cat
                    ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--line)]'
                }`}
              >
                {cat === 'all' ? `All tools (${SPENDWISE_MCP_TOOLS_CATALOG.length})` : cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTools.map((tool, idx) => (
              <div
                key={tool.name}
                className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-[var(--ink)] bg-[var(--sunken)] px-2 py-0.5 rounded-[4px] border border-[var(--line)]">
                      {tool.name}
                    </span>
                    <span className="text-xs text-[var(--ink-3)]">
                      {tool.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">{tool.summary}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                  {tool.params.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-[var(--ink-3)]">params:</span>
                      {tool.params.map((p) => (
                        <span
                          key={p}
                          className="text-xs font-mono px-1.5 py-0.2 rounded-[4px] bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--line)]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      copyToClipboard(tool.example.replace(/^"|"$/g, ''), 'Sample prompt');
                      setCopiedPromptIndex(idx);
                      setTimeout(() => setCopiedPromptIndex(null), 2000);
                    }}
                    className="w-full text-left p-2 rounded-[6px] bg-[var(--sunken)] hover:bg-[var(--line)]/50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    title="Click to copy sample prompt"
                  >
                    <span className="text-xs text-[var(--ink-2)] truncate">
                      {tool.example}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] flex items-center gap-0.5 flex-shrink-0">
                      {copiedPromptIndex === idx ? (
                        <Check className="w-3 h-3 text-[var(--credit)]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedPromptIndex === idx ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[14px] bg-[var(--surface)] border border-[var(--line)] p-6 shadow-[var(--shadow-pop)] space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink)]">
                Create secret key
              </h3>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                Name this key to track where it is used (e.g. Claude Desktop).
              </p>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
                  Key name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Claude Desktop, Cursor"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  autoFocus
                  required
                  className="input-base text-xs w-full"
                />
              </div>

              <div className="p-3 rounded-[6px] bg-[var(--sunken)] border border-[var(--line)] text-xs text-[var(--ink-3)]">
                SpendWise keys are hashed client-side with SHA-256 before storage. Secret keys are never stored in plaintext.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !keyName.trim()}
                  className="btn-primary text-xs"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    'Generate key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
