import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Users, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Shield, 
  Bell, 
  Zap, 
  Mail,
  CreditCard,
  Search,
  Menu,
  X,
  ChevronRight,
  Cpu,
  Terminal,
  Code2,
  Copy,
  Layers,
  FolderOpen,
  CheckCircle2,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import SpendWiseLogo from '../components/SpendWiseLogo';
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
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // MCP Section interactive states
  const [mcpClient, setMcpClient] = useState('claude-http');
  const [mcpOs, setMcpOs] = useState('windows');
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [mcpPromptFilter, setMcpPromptFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const features = [
    {
      icon: Wallet,
      title: 'Dual Balance Tracking',
      description: 'Seamlessly track cash and digital wallets in one unified view for complete financial clarity.',
      color: 'primary'
    },
    {
      icon: Users,
      title: 'Social Expense Splitting',
      description: 'Split bills instantly with friends. Detailed debt tracking ensures everyone settles up fairly.',
      color: 'accent'
    },
    {
      icon: PieChart,
      title: 'Intelligent Analytics',
      description: 'Visualize your spending habits with interactive charts, monthly trends, and personalized insights.',
      color: 'success'
    },
    {
      icon: Cpu,
      title: 'Official MCP Server (26 Tools)',
      description: 'Control your ledger with Claude Desktop, Cursor, or Antigravity via JSON-RPC 2.0 and SHA-256 tokens.',
      color: 'accent'
    },
    {
      icon: Mail,
      title: 'Smart Alerts',
      description: 'Get notified about low balances, large transactions, and monthly budget limits via email.',
      color: 'warning'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Your financial data is encrypted and protected with enterprise-level security protocols and Firebase auth.',
      color: 'danger'
    }
  ];

  const mcpPrompts = [
    {
      category: 'transactions',
      say: '"I just paid ₹450 for groceries on Blinkit via UPI"',
      tool: 'add_transaction',
      result: 'Deducts ₹450 from online balance & records expense under Groceries',
    },
    {
      category: 'splitting',
      say: '"Split ₹2,400 dinner with rahul@gmail.com and sneha@gmail.com"',
      tool: 'split_expense',
      result: 'Deducts ₹2,400 from payer & creates ₹800 debt records for each friend',
    },
    {
      category: 'investments',
      say: '"What is my mutual funds portfolio value and total profit?"',
      tool: 'get_portfolio_summary',
      result: 'Calculates total invested, current market value, ROI %, and asset allocation',
    },
    {
      category: 'budget',
      say: '"How much budget do I have remaining for July?"',
      tool: 'get_budget',
      result: 'Returns monthly limit, month-to-date spending, and remaining allowance',
    },
    {
      category: 'debts',
      say: '"Who owes me money and who do I owe?"',
      tool: 'get_debts',
      result: 'Summarizes active debts: Owed to You, You Owe, and net balance',
    },
    {
      category: 'recurring',
      say: '"Schedule my monthly Netflix subscription of ₹649 on online wallet"',
      tool: 'add_recurring_transaction',
      result: 'Adds scheduled recurring outlay with automated execution calculation',
    },
  ];

  const filteredPrompts = mcpPromptFilter === 'all'
    ? mcpPrompts
    : mcpPrompts.filter((p) => p.category === mcpPromptFilter);

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden selection:bg-[var(--accent-500)] selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[var(--canvas)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <SpendWiseLogo size={36} />
            <span className="text-base font-semibold tracking-wider text-[var(--navy)] uppercase">
              SpendWise
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--slate)]">
            <a href="#features" className="hover:text-[var(--navy)] transition-colors">Features</a>
            <a href="#mcp" className="flex items-center gap-1.5 hover:text-[var(--navy)] transition-colors">
              <span>MCP Protocol</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                26 Tools
              </span>
            </a>
          </div>

          {/* Desktop nav buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="btn-statement text-[10px]"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="btn-statement-primary text-[10px]"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden w-10 h-10 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex items-center justify-center hover:border-[var(--slate-light)] transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--slate)]" /> : <Menu className="w-5 h-5 text-[var(--slate)]" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-2 border-t border-[var(--hairline)] bg-[var(--white)]">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-[var(--slate)] hover:bg-[var(--canvas)] hover:text-[var(--navy)] transition-all"
            >
              Features
            </a>
            <a href="#mcp" onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-[var(--slate)] hover:bg-[var(--canvas)] hover:text-[var(--navy)] transition-all"
            >
              MCP Protocol (26 Tools)
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full btn-statement text-[10px] py-2.5"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full btn-statement-primary text-[10px] py-2.5"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Hero Section */}
      <main className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-32 max-w-[1120px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Text Content */}
          <div className="lg:w-1/2 text-left">
            <div className="stamp-pill mb-6">
              SpendWise Passbook Edition • AI Native
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tight text-[var(--navy)] mb-6 leading-[1.15]">
              Personal Expense Tracking, <br className="hidden sm:block" />
              <span className="text-[var(--slate-light)]">Redefined as a Statement.</span>
            </h1>
            
            <p className="text-sm sm:text-base text-[var(--slate)] mb-8 leading-relaxed">
              Track daily outlays, split bills with friends, manage investment portfolios, and drive your ledger through Claude Desktop or Cursor using the official Model Context Protocol (MCP) server.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-statement-primary text-[11px] py-3.5 px-6 flex items-center justify-center gap-2"
              >
                Start Your Ledger
                <ArrowRight className="w-4 h-4" />
              </button>
              <a 
                href="#mcp"
                className="btn-statement text-[11px] py-3.5 px-6 flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-emerald-600" />
                Explore MCP Integration
              </a>
            </div>
          </div>

          {/* Statement Preview Card */}
          <div className="lg:w-1/2 w-full">
            <div className="passbook-card p-5 sm:p-8 border border-[var(--hairline)] shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--hairline)] mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <SpendWiseLogo size={32} />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[var(--navy)]">SpendWise Statement</div>
                    <div className="text-[10px] font-mono text-[var(--slate-light)]">JULY 2026 PASSBOOK</div>
                  </div>
                </div>
                <span className="stamp-pill text-[9px] py-1 px-3 hidden sm:inline-flex">Live Ledger</span>
              </div>

              <div className="mb-6">
                <div className="text-[10px] uppercase tracking-[2px] text-[var(--slate-light)] font-semibold mb-1">Cumulative Outlay</div>
                <div className="font-mono text-3xl sm:text-4xl font-semibold text-[var(--navy)] tabular-nums">₹63,962.67</div>
              </div>

              <div className="space-y-3">
                <div className="ledger-row py-2">
                  <div className="font-mono text-[10px] text-[var(--slate-light)] w-12">25 MAY</div>
                  <div className="text-xs font-semibold text-[var(--navy)]">Anjeer and jamun</div>
                  <div className="flex-1 border-b border-dashed border-[var(--hairline)]"></div>
                  <div className="font-mono text-xs font-semibold text-[var(--rose)] tabular-nums">−₹110.00</div>
                </div>
                <div className="ledger-row py-2">
                  <div className="font-mono text-[10px] text-[var(--slate-light)] w-12">25 MAY</div>
                  <div className="text-xs font-semibold text-[var(--navy)]">Vadapaav and bhaje</div>
                  <div className="flex-1 border-b border-dashed border-[var(--hairline)]"></div>
                  <div className="font-mono text-xs font-semibold text-[var(--rose)] tabular-nums">−₹60.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-20 max-w-[1120px] mx-auto px-4 sm:px-6 border-t border-[var(--hairline)]">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold mb-2">High-Precision Tools</div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-[var(--navy)] mb-4 tracking-tight">
            Empowering Features for Modern Finances
          </h2>
          <p className="text-xs sm:text-sm text-[var(--slate)] max-w-xl mx-auto">
            Built with precision and care, SpendWise provides expense tracker tools, debt splitting, and AI intelligence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="statement-card p-5 sm:p-6 flex flex-col justify-between hover:border-[var(--navy)] transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-[var(--navy)] text-white flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--navy)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-[var(--slate)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* DEDICATED MODEL CONTEXT PROTOCOL (MCP) SECTION */}
      {/* ======================================================== */}
      <section id="mcp" className="py-16 sm:py-24 max-w-[1120px] mx-auto px-4 sm:px-6 border-t border-[var(--hairline)]">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[2px] text-emerald-700 dark:text-emerald-400 uppercase font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Cpu className="w-3.5 h-3.5" /> Model Context Protocol (MCP) Server
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-[var(--navy)] tracking-tight">
            Connect SpendWise Directly to Your AI Assistant
          </h2>
          <p className="text-xs sm:text-sm text-[var(--slate)] max-w-2xl mx-auto leading-relaxed">
            SpendWise exposes its entire financial engine through the official Model Context Protocol. Manage expenses, split dinner bills, track mutual fund portfolios, and monitor budgets directly inside Claude Desktop, Cursor, or Google Antigravity.
          </p>
        </div>

        {/* 3-Step Setup Workflow */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="statement-card p-5 space-y-2 border border-[var(--hairline)] hover:border-[var(--slate-light)] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center font-mono font-bold text-xs">
              1
            </div>
            <h3 className="text-sm font-semibold text-[var(--navy)]">Generate Secret Key</h3>
            <p className="text-xs text-[var(--slate)] leading-relaxed">
              Create an API key in your SpendWise Dashboard Settings. Keys are formatted as <code>spw_live_...</code> and hashed with SHA-256 for zero plaintext storage.
            </p>
          </div>

          <div className="statement-card p-5 space-y-2 border border-[var(--hairline)] hover:border-[var(--slate-light)] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center font-mono font-bold text-xs">
              2
            </div>
            <h3 className="text-sm font-semibold text-[var(--navy)]">Paste 1-Click Config</h3>
            <p className="text-xs text-[var(--slate)] leading-relaxed">
              Add SpendWise to your <code>claude_desktop_config.json</code> or <code>.cursor/mcp.json</code>. Restart the client to load all 26 financial tools automatically.
            </p>
          </div>

          <div className="statement-card p-5 space-y-2 border border-[var(--hairline)] hover:border-[var(--slate-light)] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[var(--navy)] text-white flex items-center justify-center font-mono font-bold text-xs">
              3
            </div>
            <h3 className="text-sm font-semibold text-[var(--navy)]">Chat Naturally</h3>
            <p className="text-xs text-[var(--slate)] leading-relaxed">
              Ask your assistant in plain English: &ldquo;Log ₹450 for lunch via UPI&rdquo; or &ldquo;What is my net worth?&rdquo; SpendWise executes the mutation in real time.
            </p>
          </div>
        </div>

        {/* Interactive Configuration Box */}
        <div className="statement-card p-6 sm:p-8 border border-[var(--hairline)] space-y-6 shadow-lg mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--slate-light)] font-bold">
                Client Configuration
              </div>
              <h3 className="text-base font-semibold text-[var(--navy)]">
                Copy-Paste Config Snippet
              </h3>
            </div>

            {/* Client selector tabs */}
            <div className="flex items-center gap-1 bg-[var(--canvas)] p-1 rounded-lg border border-[var(--hairline)] overflow-x-auto">
              {[
                { id: 'claude-http', label: 'Claude Desktop' },
                { id: 'cursor', label: 'Cursor' },
                { id: 'antigravity', label: 'Antigravity CLI' },
                { id: 'curl', label: 'cURL' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setMcpClient(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
                    mcpClient === c.id
                      ? 'bg-[var(--navy)] text-white font-semibold shadow-xs'
                      : 'text-[var(--slate)] hover:text-[var(--navy)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* OS Switcher & File Path (for config-based clients) */}
          {['claude-http', 'cursor', 'antigravity'].includes(mcpClient) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[var(--canvas)] border border-[var(--hairline)] text-xs">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[var(--slate)]" />
                <span className="font-semibold text-[var(--navy)]">Target File:</span>
                <code className="font-mono text-[11px] text-[var(--slate)] overflow-x-auto">
                  {CLIENT_CONFIG_PATHS[
                    mcpClient === 'antigravity' ? 'antigravity' : mcpClient === 'cursor' ? 'cursor' : 'claude'
                  ]?.[mcpOs]}
                </code>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                {['windows', 'macos', 'linux'].map((os) => (
                  <button
                    key={os}
                    onClick={() => setMcpOs(os)}
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      mcpOs === os ? 'bg-[var(--navy)] text-white font-semibold' : 'text-[var(--slate)]'
                    }`}
                  >
                    {os === 'macos' ? 'macOS' : os}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code block */}
          <div className="relative rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--hairline)] bg-[var(--white)] text-[11px] font-mono text-[var(--slate-light)]">
              <span>{mcpClient === 'curl' ? 'Terminal Command' : 'JSON Configuration'}</span>
              <button
                onClick={copySnippet}
                className="flex items-center gap-1 text-[var(--navy)] font-semibold hover:underline"
              >
                {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedMcp ? 'Copied to Clipboard' : 'Copy Snippet'}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[var(--navy)] overflow-x-auto max-h-72 leading-relaxed">
              {getMcpSnippetText()}
            </pre>
          </div>
        </div>

        {/* Real Prompts Table */}
        <div className="statement-card p-6 sm:p-8 border border-[var(--hairline)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hairline)]">
            <div>
              <div className="text-[10px] tracking-[2px] uppercase font-mono font-bold text-[var(--slate-light)]">
                Natural Language Ledger
              </div>
              <h3 className="text-base font-semibold text-[var(--navy)]">
                What You Can Tell Your AI Assistant
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'transactions', label: 'Expenses' },
                { id: 'splitting', label: 'Bill Splitting' },
                { id: 'investments', label: 'Investments' },
                { id: 'budget', label: 'Budgets' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setMcpPromptFilter(f.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    mcpPromptFilter === f.id
                      ? 'bg-[var(--navy)] text-white font-semibold'
                      : 'bg-[var(--canvas)] text-[var(--slate)] hover:bg-[var(--hairline)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[var(--hairline)]">
            {filteredPrompts.map((p, i) => (
              <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[var(--navy)]">{p.say}</span>
                  <p className="text-[11px] text-[var(--slate)]">{p.result}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                  <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {p.tool}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Catalog Footer link */}
          <div className="pt-4 border-t border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[var(--slate)]">
              SpendWise supports <strong>26 dedicated MCP tools</strong> across transactions, balances, investments, debts, and deep analytics.
            </span>
            <button
              onClick={() => navigate('/signup')}
              className="btn-statement-primary text-[10px] py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto"
            >
              Get Your API Key <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-[var(--navy)] text-white relative overflow-hidden my-8 sm:my-12">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="text-[10px] tracking-[2px] text-[var(--emerald)] uppercase font-mono font-semibold mb-3">Instant Setup</div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--slate-light)] mb-8 max-w-xl mx-auto">
            Join thousands of smart spenders who have taken control of their financial outlays with SpendWise and AI assistants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto btn-statement-primary text-[11px] py-3.5 px-8 bg-white text-[var(--navy)] border-white hover:bg-[var(--canvas)]"
            >
              Get Started Now
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto btn-statement text-[11px] py-3.5 px-8 text-white border-white/20 bg-transparent hover:bg-white/10"
            >
              Sign In To Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--hairline)] py-8 sm:py-12">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <SpendWiseLogo size={28} />
              <span className="text-sm font-semibold tracking-wider text-[var(--navy)] uppercase">SpendWise</span>
            </div>
            
            <div className="flex gap-6 text-xs text-[var(--slate)] font-medium">
              <a href="#features" className="hover:text-[var(--navy)] transition-colors">Features</a>
              <a href="#mcp" className="hover:text-[var(--navy)] transition-colors">MCP Protocol</a>
              <a href="/login" className="hover:text-[var(--navy)] transition-colors">Sign In</a>
              <a href="/signup" className="hover:text-[var(--navy)] transition-colors">Register</a>
            </div>

            <p className="text-xs text-[var(--slate-light)] font-mono">
              © 2026 SpendWise Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
