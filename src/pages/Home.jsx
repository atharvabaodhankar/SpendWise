import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  Copy, 
  Menu, 
  X, 
  FolderOpen,
  Search,
  ArrowRight
} from 'lucide-react';
import SpendWiseLogo from '../components/SpendWiseLogo';
import Money from '../components/Money';
import {
  getClaudeDesktopConfig,
  getCursorConfig,
  getAntigravityConfig,
  getCurlSnippet,
  CLIENT_CONFIG_PATHS,
  SPENDWISE_MCP_TOOLS_CATALOG,
} from '../utils/apiKeyUtils';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // MCP Section interactive states
  const [mcpClient, setMcpClient] = useState('claude-http');
  const [mcpOs, setMcpOs] = useState('windows');
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [toolSearch, setToolSearch] = useState('');

  // Interactive demo state
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Auto-cycle interactive demo every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 2);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getMcpSnippetText = () => {
    const placeholderKey = 'spw_live_YOUR_SECRET_KEY';
    const effectiveUrl = typeof window !== 'undefined' ? window.location.origin : 'https://spendwise.app';
    if (mcpClient === 'claude-http') return getClaudeDesktopConfig(placeholderKey, effectiveUrl);
    if (mcpClient === 'cursor') return getCursorConfig(placeholderKey, effectiveUrl);
    if (mcpClient === 'antigravity') return getAntigravityConfig(placeholderKey, effectiveUrl);
    return getCurlSnippet(placeholderKey, effectiveUrl);
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getMcpSnippetText());
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const filteredTools = useMemo(() => {
    const q = toolSearch.toLowerCase().trim();
    if (!q) return SPENDWISE_MCP_TOOLS_CATALOG;
    return SPENDWISE_MCP_TOOLS_CATALOG.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [toolSearch]);

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] flex flex-col antialiased">
      
      {/* 56px Sticky Top Bar */}
      <header className="sticky top-0 z-40 h-14 bg-[var(--bg)]/90 backdrop-blur-[8px] border-b border-[var(--line)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 h-full">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="SpendWise home">
              <SpendWiseLogo size={28} />
              <span className="font-semibold text-[var(--ink)] text-base">
                SpendWise
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-[var(--ink-2)]">
              <a href="#features" className="hover:text-[var(--ink)] transition-colors">Features</a>
              <a href="#mcp" className="hover:text-[var(--ink)] transition-colors">MCP agent</a>
              <a href="#catalog" className="hover:text-[var(--ink)] transition-colors">Tools</a>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => navigate('/login')}
              className="btn-quiet text-xs"
            >
              Sign in
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="btn-primary text-xs"
            >
              Create account
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4 space-y-3">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs text-[var(--ink-2)] hover:text-[var(--ink)] py-1"
            >
              Features
            </a>
            <a 
              href="#mcp" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs text-[var(--ink-2)] hover:text-[var(--ink)] py-1"
            >
              MCP agent setup
            </a>
            <a 
              href="#catalog" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs text-[var(--ink-2)] hover:text-[var(--ink)] py-1"
            >
              Tools catalog
            </a>
            <div className="pt-2 flex flex-col gap-2 border-t border-[var(--line)]">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full btn-secondary text-xs"
              >
                Sign in
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full btn-primary text-xs"
              >
                Create free account
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 space-y-20">

        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl font-semibold text-[var(--ink)] leading-[1.15]">
              Log your spending by sending a message.
            </h1>

            <p className="text-sm sm:text-base text-[var(--ink-2)] max-w-xl leading-relaxed">
              SpendWise is a personal money ledger for India. Track your Online and Cash wallets, split bills with friends, and let your AI agent record transactions directly into your ledger.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-primary text-xs py-2.5 px-4"
              >
                Create free account
              </button>
              <a 
                href="#mcp"
                className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-1.5"
              >
                See how the agent connects
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Agent Demo: Message Bubble + Flashing Ledger Row */}
          <div className="lg:col-span-5 border border-[var(--line)] rounded-[6px] bg-[var(--surface)] p-5 space-y-4">
            <div className="text-xs font-medium text-[var(--ink-3)]">
              Live agent interaction
            </div>

            {/* Simulated chat bubble */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-[14px] bg-[var(--accent-soft)] text-[var(--ink)] border border-[var(--accent)]/20 px-3.5 py-2 text-xs">
                {demoStep === 0 ? '₹450 lunch via UPI with Rahul' : 'Split ₹1,200 dinner equally with Sneha'}
              </div>
            </div>

            {/* Divider with transition indicator */}
            <div className="flex items-center gap-2 text-xs text-[var(--ink-3)] py-1">
              <span className="w-2 h-2 rounded-full bg-[var(--credit)] animate-pulse" />
              <span>MCP agent updated your ledger</span>
            </div>

            {/* Flashing ledger row */}
            <div className="border border-[var(--line)] rounded-[4px] overflow-hidden bg-[var(--bg)]">
              <div className="p-3 row-flash flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)] truncate">
                    {demoStep === 0 ? 'Lunch with Rahul' : 'Dinner with Sneha'}
                  </p>
                  <p className="text-xs text-[var(--ink-3)]">
                    {demoStep === 0 ? 'Food · Online' : 'Food · Cash · ₹600 split with Sneha'}
                  </p>
                </div>
                <div className="text-right">
                  <Money 
                    amount={demoStep === 0 ? 450 : 1200} 
                    type="expense" 
                    size="body" 
                  />
                  <p className="text-xs text-[var(--ink-3)]">Just now</p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-[var(--ink-3)] flex items-center justify-between">
              <span>Online balance: ₹18,450.00</span>
              <button 
                onClick={() => setDemoStep((prev) => (prev + 1) % 2)}
                className="text-[var(--accent)] hover:underline cursor-pointer"
              >
                Cycle example
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES: 3 TEXT ROWS (NO CARDS, NO ICON CHIPS) */}
        <section id="features" className="space-y-4 pt-8 border-t border-[var(--line)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--ink)]">
              Core ledger capabilities
            </h2>
            <p className="text-xs text-[var(--ink-3)] mt-0.5">
              Designed around how money moves in India.
            </p>
          </div>

          <div className="divide-y divide-[var(--line)]">
            <div className="py-4 grid sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
              <span className="sm:col-span-3 font-medium text-xs text-[var(--ink)]">
                Dual wallet ledger
              </span>
              <p className="sm:col-span-9 text-xs text-[var(--ink-2)] leading-relaxed">
                Online (UPI and bank account) and Cash in hand are tracked side-by-side. Chronological day groupings, daily subtotals, and no hidden calculations.
              </p>
            </div>

            <div className="py-4 grid sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
              <span className="sm:col-span-3 font-medium text-xs text-[var(--ink)]">
                Social debt tracking
              </span>
              <p className="sm:col-span-9 text-xs text-[var(--ink-2)] leading-relaxed">
                Split bills with friends and keep a running record of who owes whom. Settle debts with a single tap, updating your wallet records automatically.
              </p>
            </div>

            <div className="py-4 grid sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
              <span className="sm:col-span-3 font-medium text-xs text-[var(--ink)]">
                Monthly budget pace
              </span>
              <p className="sm:col-span-9 text-xs text-[var(--ink-2)] leading-relaxed">
                Monitor monthly spending pace against your budget with daily allowance indicators and banknote-hued category breakdowns.
              </p>
            </div>
          </div>
        </section>

        {/* MCP SECTION */}
        <section id="mcp" className="space-y-6 pt-8 border-t border-[var(--line)]">
          <div className="max-w-xl">
            <h2 className="text-[17px] font-semibold text-[var(--ink)]">
              Model Context Protocol (MCP) connection
            </h2>
            <p className="text-xs text-[var(--ink-3)] mt-0.5 leading-relaxed">
              SpendWise exposes 26 JSON-RPC tools. Add your configuration to Claude Desktop, Cursor, or Antigravity to log expenses and check balances straight from chat.
            </p>
          </div>

          {/* Config Box */}
          <div className="border border-[var(--line)] rounded-[6px] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
              {/* Client picker */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'claude-http', label: 'Claude Desktop' },
                  { id: 'cursor', label: 'Cursor' },
                  { id: 'antigravity', label: 'Antigravity' },
                  { id: 'curl', label: 'cURL' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setMcpClient(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                      mcpClient === c.id
                        ? 'bg-[var(--accent)] text-[var(--on-accent)] font-medium'
                        : 'text-[var(--ink-2)] hover:bg-[var(--sunken)]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* OS switcher for config clients */}
              {['claude-http', 'cursor', 'antigravity'].includes(mcpClient) && (
                <div className="flex items-center gap-1 bg-[var(--sunken)] p-0.5 rounded-[6px]">
                  {['windows', 'macos', 'linux'].map((os) => (
                    <button
                      key={os}
                      onClick={() => setMcpOs(os)}
                      className={`text-xs px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer ${
                        mcpOs === os ? 'bg-[var(--surface)] text-[var(--ink)] font-medium' : 'text-[var(--ink-3)]'
                      }`}
                    >
                      {os === 'macos' ? 'macOS' : os === 'windows' ? 'Windows' : 'Linux'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target file location */}
            {['claude-http', 'cursor', 'antigravity'].includes(mcpClient) && (
              <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
                <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Config location:</span>
                <code className="font-mono text-xs text-[var(--ink)] overflow-x-auto">
                  {CLIENT_CONFIG_PATHS[
                    mcpClient === 'antigravity' ? 'antigravity' : mcpClient === 'cursor' ? 'cursor' : 'claude'
                  ]?.[mcpOs]}
                </code>
              </div>
            )}

            {/* Sunken code block */}
            <div className="rounded-[6px] border border-[var(--line)] bg-[var(--sunken)] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)] text-xs text-[var(--ink-3)]">
                <span>{mcpClient === 'curl' ? 'Terminal snippet' : 'Config JSON'}</span>
                <button
                  onClick={copySnippet}
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedMcp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedMcp ? 'Copied' : 'Copy snippet'}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-[var(--ink)] overflow-x-auto max-h-64 leading-relaxed">
                {getMcpSnippetText()}
              </pre>
            </div>
          </div>
        </section>

        {/* 2-COLUMN PLAIN TOOLS CATALOG */}
        <section id="catalog" className="space-y-4 pt-8 border-t border-[var(--line)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--ink)]">
                MCP tools catalog ({SPENDWISE_MCP_TOOLS_CATALOG.length})
              </h2>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                Full list of operations available to connected agents.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
              <input
                type="text"
                placeholder="Search tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="input-base pl-8 text-xs w-full py-1.5"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {filteredTools.map((tool) => (
              <div 
                key={tool.name} 
                className="p-3 border border-[var(--line)] rounded-[6px] bg-[var(--surface)] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--ink)]">
                    {tool.name}
                  </span>
                  <span className="text-xs text-[var(--ink-3)]">
                    {tool.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {tool.summary}
                </p>
                <p className="text-xs text-[var(--ink-3)] italic">
                  {tool.example}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--line)] py-8 mt-12 bg-[var(--surface)] text-xs text-[var(--ink-3)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SpendWiseLogo size={20} />
            <span className="font-semibold text-[var(--ink)]">SpendWise</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-[var(--ink)]">Features</a>
            <a href="#mcp" className="hover:text-[var(--ink)]">MCP</a>
            <Link to="/login" className="hover:text-[var(--ink)]">Sign in</Link>
            <Link to="/signup" className="hover:text-[var(--ink)]">Create account</Link>
          </div>

          <div>
            © 2026 SpendWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
