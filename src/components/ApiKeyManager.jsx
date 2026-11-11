import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Code2,
  Cpu,
  ExternalLink,
  RefreshCw,
  Terminal,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  Monitor,
  Laptop,
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
  const { showSuccess, showError } = useNotification();

  // Top-level subtab: 'keys' | 'setup' | 'tools'
  const [managerTab, setManagerTab] = useState('keys');

  // Keys state
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rulesNeeded, setRulesNeeded] = useState(false);
  const [copiedRule, setCopiedRule] = useState(false);

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
      showSuccess('API Key generated successfully! Save it now.');
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
        `Are you sure you want to revoke "${name}"? Any AI client or script using this key will immediately lose access.`
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
    showSuccess(`${label} copied to clipboard!`);
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

  // Determine key to show in snippets (newly created key if active, else latest active prefix or placeholder)
  const displayApiKey = newlyCreatedKey ? newlyCreatedKey.rawKey : 'spw_live_YOUR_SECRET_KEY';
  const effectiveApiUrl = getEffectiveApiUrl();

  // Snippet generator
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

  // Filter tools
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
      {/* Primary Header Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-[var(--navy)]">
                Model Context Protocol (MCP) & API Keys
              </h3>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                26 Tools Active
              </span>
            </div>
            <p className="text-xs text-[var(--slate)] mt-1 max-w-xl leading-relaxed">
              Connect SpendWise natively to Claude Desktop, Cursor, Antigravity, or custom agents. All requests run through standard JSON-RPC 2.0 with SHA-256 hashed authentication.
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

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--hairline)] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setManagerTab('keys')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            managerTab === 'keys'
              ? 'bg-[var(--navy)] text-white shadow-sm'
              : 'text-[var(--slate)] hover:bg-[var(--canvas)] hover:text-[var(--navy)]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          My Secret Keys
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
            {keys.length}
          </span>
        </button>

        <button
          onClick={() => setManagerTab('setup')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            managerTab === 'setup'
              ? 'bg-[var(--navy)] text-white shadow-sm'
              : 'text-[var(--slate)] hover:bg-[var(--canvas)] hover:text-[var(--navy)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Client Setup Guides
        </button>

        <button
          onClick={() => setManagerTab('tools')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            managerTab === 'tools'
              ? 'bg-[var(--navy)] text-white shadow-sm'
              : 'text-[var(--slate)] hover:bg-[var(--canvas)] hover:text-[var(--navy)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Available Tools Catalog (26)
        </button>
      </div>

      {/* Firebase Rules Alert */}
      {rulesNeeded && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                  Firebase Security Rule Update Needed
                </h5>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90 mt-1 leading-relaxed">
                  Firestore blocked access to <code>apiKeys</code> because the security rule is pending in Firebase Console.
                </p>
              </div>
            </div>
            <button
              onClick={loadKeys}
              className="btn-statement text-[10px] py-1 px-2.5 flex items-center gap-1 flex-shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>

          <pre className="p-2.5 rounded-lg bg-black/10 dark:bg-black/30 border border-amber-500/20 text-[10px] font-mono overflow-x-auto leading-relaxed">
            {FIRESTORE_RULE_SNIPPET}
          </pre>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: KEYS LIST */}
      {/* ======================================================== */}
      {managerTab === 'keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--slate)]">
            <span className="font-semibold text-[var(--navy)]">Active Access Tokens</span>
            <span>Authentication: Bearer Token</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 border border-[var(--hairline)] rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--navy)]" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas)] space-y-3">
              <Key className="w-8 h-8 text-[var(--slate-light)] mx-auto opacity-50" />
              <div>
                <p className="text-sm font-semibold text-[var(--navy)]">No secret keys generated yet</p>
                <p className="text-xs text-[var(--slate-light)] mt-1 max-w-sm mx-auto">
                  Click &ldquo;Create Secret Key&rdquo; to generate an authentication token for Claude, Cursor, or Antigravity.
                </p>
              </div>
              <button
                onClick={() => {
                  setKeyName('');
                  setShowCreateModal(true);
                }}
                className="btn-statement-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Generate First Key
              </button>
            </div>
          ) : (
            <div className="border border-[var(--hairline)] rounded-xl overflow-hidden divide-y divide-[var(--hairline)] bg-[var(--white)] shadow-sm">
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
                    <div className="flex items-center gap-2.5 text-[11px] text-[var(--slate-light)] font-mono flex-wrap">
                      <span className="bg-[var(--canvas)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
                        {k.prefix}
                      </span>
                      <span>•</span>
                      <span>Created {formatDate(k.createdAt)}</span>
                      <span>•</span>
                      <span>Last used {formatDate(k.lastUsedAt)}</span>
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

          {/* Quick Setup Card */}
          <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--navy)]">Ready to configure your AI assistant?</span>
              <p className="text-[11px] text-[var(--slate)]">
                Switch to the Client Setup tab to view exact file paths and one-click JSON configurations for Claude, Cursor, and Antigravity.
              </p>
            </div>
            <button
              onClick={() => setManagerTab('setup')}
              className="btn-statement text-xs py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
            >
              Setup Guides <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CLIENT SETUP GUIDES */}
      {/* ======================================================== */}
      {managerTab === 'setup' && (
        <div className="space-y-5">
          {/* Client Selector Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--slate-light)]">
              1. Select Your AI Client
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'claude-http', label: 'Claude Desktop (HTTP)', badge: 'Recommended' },
                { id: 'cursor', label: 'Cursor', badge: '.cursor/mcp.json' },
                { id: 'antigravity', label: 'Google Antigravity', badge: 'CLI' },
                { id: 'windsurf', label: 'Windsurf', badge: 'Config' },
                { id: 'claude-stdio', label: 'Claude (stdio runner)' },
                { id: 'curl', label: 'cURL / Direct Test' },
                { id: 'python', label: 'Python Script' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                    selectedClient === c.id
                      ? 'bg-[var(--navy)] text-white border-[var(--navy)] shadow-sm'
                      : 'bg-[var(--white)] text-[var(--slate)] border-[var(--hairline)] hover:border-[var(--slate-light)]'
                  }`}
                >
                  <span>{c.label}</span>
                  {c.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        selectedClient === c.id
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {c.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Config file path card (for file-based clients) */}
          {['claude-http', 'claude-stdio', 'cursor', 'antigravity', 'windsurf'].includes(selectedClient) && (
            <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--white)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--navy)]">
                  <FolderOpen className="w-4 h-4 text-[var(--navy)]" />
                  <span>Configuration File Location</span>
                </div>

                {/* OS Switcher */}
                <div className="flex items-center gap-1 bg-[var(--canvas)] p-0.5 rounded-md border border-[var(--hairline)]">
                  {['windows', 'macos', 'linux'].map((os) => (
                    <button
                      key={os}
                      onClick={() => setSelectedOs(os)}
                      className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded transition-colors ${
                        selectedOs === os
                          ? 'bg-[var(--navy)] text-white shadow-xs'
                          : 'text-[var(--slate)] hover:text-[var(--navy)]'
                      }`}
                    >
                      {os === 'macos' ? 'macOS' : os}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact path */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)]">
                <code className="text-xs font-mono text-[var(--navy)] flex-1 overflow-x-auto whitespace-nowrap">
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
                  className="btn-statement text-[10px] py-1 px-2 flex items-center gap-1 flex-shrink-0"
                >
                  {copiedPath ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedPath ? 'Copied' : 'Copy Path'}
                </button>
              </div>
            </div>
          )}

          {/* Config Snippet Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--navy)] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                2. Configuration Snippet
              </span>
              <button
                onClick={() => {
                  const snippet = getSnippetForClient(selectedClient, displayApiKey);
                  copyToClipboard(snippet, 'Configuration');
                  setCopiedSetupSnippet(true);
                  setTimeout(() => setCopiedSetupSnippet(false), 2000);
                }}
                className="btn-statement-primary text-xs py-1 px-3 flex items-center gap-1"
              >
                {copiedSetupSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" /> Copied Config
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Config
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] overflow-hidden">
              <pre className="p-4 text-[11px] font-mono text-[var(--navy)] overflow-x-auto max-h-72 leading-relaxed">
                {getSnippetForClient(selectedClient, displayApiKey)}
              </pre>
            </div>

            {!newlyCreatedKey && (
              <p className="text-[11px] text-[var(--slate-light)] italic">
                Note: Replace <code>spw_live_YOUR_SECRET_KEY</code> with your real key from the &ldquo;My Secret Keys&rdquo; tab.
              </p>
            )}
          </div>

          {/* 3-Step Walkthrough */}
          <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--white)] space-y-3">
            <h4 className="text-xs font-semibold text-[var(--navy)] uppercase tracking-wider">
              3. Verification & How To Use
            </h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] space-y-1">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[var(--navy)] text-white text-[10px] flex items-center justify-center font-mono">
                    1
                  </span>
                  Paste & Save
                </div>
                <p className="text-[11px] text-[var(--slate)] leading-relaxed">
                  Open your config file in any text editor, paste the JSON snippet, and save the file.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] space-y-1">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[var(--navy)] text-white text-[10px] flex items-center justify-center font-mono">
                    2
                  </span>
                  Restart Client
                </div>
                <p className="text-[11px] text-[var(--slate)] leading-relaxed">
                  Quit and reopen Claude Desktop or Cursor so it establishes the new MCP server connection.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] space-y-1">
                <div className="font-bold text-[var(--navy)] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[var(--navy)] text-white text-[10px] flex items-center justify-center font-mono">
                    3
                  </span>
                  Chat Naturally
                </div>
                <p className="text-[11px] text-[var(--slate)] leading-relaxed">
                  Ask your assistant: <em>&ldquo;Log ₹450 for lunch via UPI&rdquo;</em> or <em>&ldquo;What is my net worth?&rdquo;</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: TOOL CATALOG */}
      {/* ======================================================== */}
      {managerTab === 'tools' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slate-light)]" />
              <input
                type="text"
                placeholder="Search tools by name, parameter, or prompt..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="input-premium pl-8 text-xs w-full py-1.5"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setToolCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  toolCategory === cat
                    ? 'bg-[var(--navy)] text-white font-semibold'
                    : 'bg-[var(--canvas)] text-[var(--slate)] hover:bg-[var(--hairline)]'
                }`}
              >
                {cat === 'all' ? `All Tools (${SPENDWISE_MCP_TOOLS_CATALOG.length})` : cat}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredTools.map((tool, idx) => (
              <div
                key={tool.name}
                className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--white)] space-y-2 flex flex-col justify-between hover:border-[var(--slate-light)] transition-all shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--navy)] bg-[var(--canvas)] px-2 py-0.5 rounded border border-[var(--hairline)]">
                      {tool.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      {tool.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--slate)] leading-relaxed">{tool.summary}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--hairline)]">
                  {/* Parameter chips */}
                  {tool.params.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-[var(--slate-light)] font-mono">params:</span>
                      {tool.params.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--canvas)] text-[var(--slate)] border border-[var(--hairline)]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Click to copy prompt */}
                  <button
                    onClick={() => {
                      copyToClipboard(tool.example.replace(/^"|"$/g, ''), 'Sample prompt');
                      setCopiedPromptIndex(idx);
                      setTimeout(() => setCopiedPromptIndex(null), 2000);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-[var(--canvas)] hover:bg-[var(--slate-faint)]/50 transition-colors flex items-center justify-between gap-2 group"
                    title="Click to copy sample prompt"
                  >
                    <span className="text-[11px] font-medium text-[var(--navy)] truncate italic">
                      {tool.example}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--slate-light)] group-hover:text-[var(--navy)] flex items-center gap-0.5 flex-shrink-0">
                      {copiedPromptIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-600" />
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

      {/* ======================================================== */}
      {/* MODAL 1: CREATE KEY */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="statement-card shadow-2xl w-full max-w-md overflow-hidden p-6 border border-[var(--hairline)]">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[var(--navy)]" />
              <h3 className="text-base font-semibold text-[var(--navy)]">Generate Secret Key</h3>
            </div>
            <p className="text-xs text-[var(--slate)] mb-4 leading-relaxed">
              Name this key to easily track where it is being used (e.g. &ldquo;Claude Desktop Work Mac&rdquo;).
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="label-premium">Key Label / Client Name</label>
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
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  SpendWise keys are hashed client-side with SHA-256 before storage. Secret keys are never stored plaintext in our database.
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
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

      {/* ======================================================== */}
      {/* MODAL 2: NEWLY CREATED KEY (SHOWN ONCE) */}
      {/* ======================================================== */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="statement-card shadow-2xl w-full max-w-xl overflow-hidden p-6 border border-[var(--hairline)] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--navy)]">
                Secret Key Generated: {newlyCreatedKey.name}
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Please copy your secret key right now.</strong> For your protection, it will never be displayed again after closing this dialog.
              </div>
            </div>

            {/* Secret key box */}
            <div className="space-y-1.5">
              <label className="label-premium">Your Secret API Key</label>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)]">
                <code className="text-xs font-mono font-bold text-[var(--navy)] flex-1 break-all select-all">
                  {newlyCreatedKey.rawKey}
                </code>
                <button
                  onClick={() => {
                    copyToClipboard(newlyCreatedKey.rawKey, 'Secret Key');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="btn-statement-primary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* 1-Click Client Config Preview */}
            <div className="pt-3 border-t border-[var(--hairline)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--navy)] flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-600" /> Pre-filled Client Configuration
                </span>
                <button
                  onClick={() => {
                    const snippet = getSnippetForClient(modalSnippetClient, newlyCreatedKey.rawKey);
                    copyToClipboard(snippet, 'Configuration');
                    setCopiedModalSnippet(true);
                    setTimeout(() => setCopiedModalSnippet(false), 2000);
                  }}
                  className="text-xs font-semibold text-[var(--navy)] hover:underline flex items-center gap-1"
                >
                  {copiedModalSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedModalSnippet ? 'Copied' : 'Copy Config'}
                </button>
              </div>

              <div className="flex items-center gap-1 border-b border-[var(--hairline)] pb-1.5">
                {[
                  { id: 'claude-http', label: 'Claude Desktop' },
                  { id: 'cursor', label: 'Cursor' },
                  { id: 'antigravity', label: 'Antigravity' },
                  { id: 'curl', label: 'cURL' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setModalSnippetClient(c.id)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                      modalSnippetClient === c.id
                        ? 'bg-[var(--navy)] text-white font-semibold'
                        : 'text-[var(--slate)] hover:bg-[var(--canvas)]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <pre className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] text-[11px] font-mono text-[var(--navy)] overflow-x-auto max-h-40 leading-relaxed">
                {getSnippetForClient(modalSnippetClient, newlyCreatedKey.rawKey)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--hairline)]">
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="btn-statement-primary text-xs py-2 px-5"
              >
                I Have Saved My Secret Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
