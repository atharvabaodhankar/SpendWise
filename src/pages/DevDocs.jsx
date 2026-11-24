import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Code,
  Terminal,
  Layers,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Zap,
  Bot,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import SpendWiseLogo from '../components/SpendWiseLogo';
import CustomSelect from '../components/CustomSelect';
import { SPENDWISE_MCP_TOOLS_CATALOG, getEffectiveApiUrl } from '../utils/apiKeyUtils';

const CLIENT_GUIDES = [
  {
    id: 'telegram',
    title: 'Telegram Bot (Atharva OS)',
    badge: 'Popular',
    icon: Bot,
    description: 'Connect an autonomous Telegram bot to SpendWise via MCP HTTP or Stdio for voice and text expense logging.',
    code: `# Python Telegram Bot Integration (e.g. Atharva OS / python-telegram-bot)
import os, requests, json
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

SPENDWISE_API_URL = os.getenv("SPENDWISE_API_URL", "https://spendwise.vercel.app")
SPENDWISE_API_KEY = os.getenv("SPENDWISE_API_KEY", "spw_live_your_key_here")

def call_spendwise_mcp(tool_name: str, arguments: dict):
    """Executes an MCP tool call over JSON-RPC 2.0."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SPENDWISE_API_KEY}"
    }
    response = requests.post(f"{SPENDWISE_API_URL}/api/mcp", json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    res = response.json()
    if "error" in res:
        raise ValueError(res["error"].get("message", "MCP Tool Error"))
    # The tool result text is returned in content[0].text
    return res.get("result", {}).get("content", [{}])[0].get("text", "")

async def log_expense(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Example: Log ₹10 for Tea in Cash wallet
    result = call_spendwise_mcp("add_transaction", {
        "amount": 10.0,
        "category": "Groceries",
        "description": "Tea",
        "paymentMethod": "cash"
    })
    # Fetch monthly summary for consistent spend reporting
    summary_raw = call_spendwise_mcp("get_summary", {})
    summary = json.loads(summary_raw) if isinstance(summary_raw, str) else summary_raw
    total_spent = summary.get("currentMonth", {}).get("totalSpent", 0)

    reply_text = (
        "Expense Logged Successfully!\\n"
        "Amount: ₹10\\n"
        "Category: Groceries\\n"
        "Payment Method: Cash\\n"
        f"November 2026 Spending: ₹{total_spent:,.0f}"
    )
    await update.message.reply_text(reply_text)
`,
  },
  {
    id: 'claude',
    title: 'Claude Desktop',
    badge: 'Desktop',
    icon: Terminal,
    description: 'Direct stdio transport or remote SSE/HTTP bridge into Anthropic Claude Desktop on macOS and Windows.',
    code: `{
  "mcpServers": {
    "spendwise": {
      "command": "node",
      "args": ["C:/Users/baodh/OneDrive/Desktop/Projects/SpendWise/mcp/server.js"],
      "env": {
        "SPENDWISE_API_KEY": "spw_live_YOUR_GENERATED_KEY",
        "SPENDWISE_API_URL": "http://localhost:5173"
      }
    }
  }
}`,
  },
  {
    id: 'cursor',
    title: 'Cursor IDE',
    badge: 'Editor',
    icon: Code,
    description: 'Add to .cursor/mcp.json for codebase-aware personal financial tracking and ledger automation.',
    code: `{
  "mcpServers": {
    "spendwise": {
      "url": "http://localhost:5173/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_GENERATED_KEY"
      }
    }
  }
}`,
  },
  {
    id: 'antigravity',
    title: 'Antigravity / Gemini',
    badge: 'Agent',
    icon: Zap,
    description: 'Connect autonomous agent workers and tool runners to SpendWise through stdio transport.',
    code: `{
  "mcpServers": {
    "spendwise": {
      "command": "node",
      "args": ["./mcp/server.js"],
      "env": {
        "SPENDWISE_API_KEY": "spw_live_YOUR_GENERATED_KEY",
        "SPENDWISE_API_URL": "http://localhost:5173"
      }
    }
  }
}`,
  },
  {
    id: 'curl',
    title: 'cURL / Direct HTTP',
    badge: 'HTTP',
    icon: ExternalLink,
    description: 'Raw JSON-RPC 2.0 over HTTP POST. Compatible with any language, runtime, or webhook.',
    code: `curl -X POST https://spendwise.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer spw_live_YOUR_GENERATED_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_summary",
      "arguments": {}
    }
  }'`,
  },
];

const DETAILED_TOOL_SPECS = {
  add_transaction: {
    description: 'Log an expense or income transaction. Automatically deducts or increments Online or Cash wallet balances and checks budget alert thresholds.',
    params: [
      { name: 'amount', type: 'number', required: true, desc: 'Positive amount in INR (e.g. 250.00)' },
      { name: 'type', type: 'string', required: false, desc: '"expense" (default) or "income"' },
      { name: 'category', type: 'string', required: false, desc: 'Category (Food & Dining, Shopping, Bills & Utilities, Groceries, etc.)' },
      { name: 'paymentMethod', type: 'string', required: false, desc: '"online" (default) or "cash"' },
      { name: 'description', type: 'string', required: false, desc: 'Merchant note or item label (e.g. "Swiggy Dinner")' },
      { name: 'date', type: 'string', required: false, desc: 'YYYY-MM-DD date string (defaults to today in local calendar)' },
      { name: 'affectCurrentBalance', type: 'boolean', required: false, desc: 'Whether to deduct from wallet balance (default true)' },
    ],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/call',
      params: {
        name: 'add_transaction',
        arguments: {
          amount: 190.0,
          category: 'Food & Dining',
          description: 'Biryani lunch',
          paymentMethod: 'cash',
        },
      },
    },
    sampleResponse: {
      success: true,
      transactionId: 'tx_98a72b1',
      type: 'expense',
      amount: 190.0,
      category: 'Food & Dining',
      paymentMethod: 'cash',
      message: 'Successfully logged expense of ₹190.00 for "Biryani lunch" (cash wallet).',
    },
  },
  get_summary: {
    description: 'Calculates complete financial snapshot: online & cash wallet balances, current month spending, total monthly income, net savings, and budget health.',
    params: [],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 102,
      method: 'tools/call',
      params: { name: 'get_summary', arguments: {} },
    },
    sampleResponse: {
      balances: { online: 24500.0, cash: 4000.0, total: 28500.0, currency: 'INR (₹)' },
      currentMonth: {
        month: 'November 2026',
        totalSpent: 4831.0,
        totalIncome: 75000.0,
        netSavings: 70169.0,
        budgetLimit: 25000.0,
        budgetRemaining: 20169.0,
        budgetUtilizationPercent: 19,
        isOverBudget: false,
      },
    },
  },
  list_transactions: {
    description: 'Query past transactions with date range, category, type, and keyword search filters.',
    params: [
      { name: 'limit', type: 'number', required: false, desc: 'Max records to return (1-100, default 15)' },
      { name: 'category', type: 'string', required: false, desc: 'Filter by category name' },
      { name: 'type', type: 'string', required: false, desc: '"expense" or "income"' },
      { name: 'startDate', type: 'string', required: false, desc: 'Start date filter YYYY-MM-DD' },
      { name: 'endDate', type: 'string', required: false, desc: 'End date filter YYYY-MM-DD' },
      { name: 'search', type: 'string', required: false, desc: 'Keyword in description or category' },
    ],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 103,
      method: 'tools/call',
      params: {
        name: 'list_transactions',
        arguments: { limit: 5, category: 'Food & Dining' },
      },
    },
    sampleResponse: {
      count: 2,
      transactions: [
        { id: 'tx_1', amount: 90.0, category: 'Food & Dining', description: 'Lunch', paymentMethod: 'cash', date: '2026-11-20' },
        { id: 'tx_2', amount: 1800.0, category: 'Food & Dining', description: 'Mess fee', paymentMethod: 'online', date: '2026-11-21' },
      ],
    },
  },
  get_budget: {
    description: 'Fetch current monthly budget limit, real-time month-to-date spending, remaining allowance, and budget status (on_track, critical, exceeded).',
    params: [],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 104,
      method: 'tools/call',
      params: { name: 'get_budget', arguments: {} },
    },
    sampleResponse: {
      month: 'November 2026',
      monthlyLimit: 25000.0,
      totalSpent: 4831.0,
      remainingAllowance: 20169.0,
      utilizationPercent: 19,
      status: 'on_track',
    },
  },
  add_investment: {
    description: 'Log an investment holding in Fixed Deposits, Mutual Funds, Digital Gold, Stocks, or Crypto with principal and current market valuation.',
    params: [
      { name: 'name', type: 'string', required: true, desc: 'Name of holding (e.g. "SBI Fixed Deposit", "Parag Parikh Flexi Cap")' },
      { name: 'assetType', type: 'string', required: true, desc: '"fd", "mutual_fund", "gold", "silver", "stocks", "crypto", "other"' },
      { name: 'investedAmount', type: 'number', required: true, desc: 'Principal amount invested' },
      { name: 'currentValue', type: 'number', required: false, desc: 'Current valuation (defaults to investedAmount)' },
      { name: 'provider', type: 'string', required: false, desc: 'Bank or broker (SBI, Zerodha, Groww, PhonePe)' },
      { name: 'interestRate', type: 'number', required: false, desc: 'Annual interest rate % for FDs (e.g. 7.5)' },
      { name: 'maturityDate', type: 'string', required: false, desc: 'Maturity date YYYY-MM-DD for FDs' },
    ],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 105,
      method: 'tools/call',
      params: {
        name: 'add_investment',
        arguments: {
          name: 'SBI 1-Year FD',
          assetType: 'fd',
          investedAmount: 18500.0,
          currentValue: 18500.0,
          provider: 'SBI',
          interestRate: 7.25,
          maturityDate: '2027-11-20',
        },
      },
    },
    sampleResponse: {
      success: true,
      investmentId: 'inv_442',
      name: 'SBI 1-Year FD',
      assetType: 'fd',
      investedAmount: 18500.0,
      currentValue: 18500.0,
      interestRate: 7.25,
      maturityDate: '2027-11-20',
      message: 'Successfully logged investment "SBI 1-Year FD" (₹18,500.00).',
    },
  },
  get_portfolio_summary: {
    description: 'Calculate complete investment portfolio summary: total invested, current valuation, profit/loss, return percentage, and asset allocation breakdown.',
    params: [],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 106,
      method: 'tools/call',
      params: { name: 'get_portfolio_summary', arguments: {} },
    },
    sampleResponse: {
      holdingsCount: 2,
      summary: {
        totalInvested: 28500.0,
        totalCurrentValue: 28500.0,
        totalProfitLoss: 0.0,
        overallROI: '0.0%',
        assetAllocation: [
          { assetType: 'fd', invested: 18500.0, currentValue: 18500.0, percent: '65%' },
          { assetType: 'mutual_fund', invested: 10000.0, currentValue: 10000.0, percent: '35%' },
        ],
      },
    },
  },
  get_analytics: {
    description: 'Deep spending analytics: category breakdown percentages, online vs cash ratio, daily spend average, and peak spending dates.',
    params: [
      { name: 'month', type: 'string', required: false, desc: 'Target month YYYY-MM (e.g. "2026-11") or "all"' },
    ],
    sampleRequest: {
      jsonrpc: '2.0',
      id: 107,
      method: 'tools/call',
      params: {
        name: 'get_analytics',
        arguments: { month: '2026-11' },
      },
    },
    sampleResponse: {
      period: '2026-11',
      overview: {
        totalExpenses: 4831.0,
        totalIncome: 75000.0,
        onlineVsCash: { online: 3200.0, cash: 1631.0, cashPercent: '34%' },
      },
      categoryBreakdown: [
        { category: 'Food & Dining', amount: 2650.0, percentage: '55%' },
        { category: 'Shopping', amount: 800.0, percentage: '17%' },
        { category: 'Other', amount: 654.0, percentage: '14%' },
      ],
    },
  },
};

export default function DevDocs() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'clients' | 'tools' | 'console' | 'faq'
  const [selectedClient, setSelectedClient] = useState('telegram');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toolSearch, setToolSearch] = useState('');
  const [selectedToolName, setSelectedToolName] = useState('get_summary');
  const [copiedSection, setCopiedSection] = useState(null);

  // Live Console state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [consoleTool, setConsoleTool] = useState('get_summary');
  const [consoleArgs, setConsoleArgs] = useState('{}');
  const [consoleRunning, setConsoleRunning] = useState(false);
  const [consoleResponse, setConsoleResponse] = useState(null);
  const [consoleError, setConsoleError] = useState(null);

  const copyToClipboard = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const categories = useMemo(() => {
    const set = new Set();
    SPENDWISE_MCP_TOOLS_CATALOG.forEach((t) => set.add(t.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredTools = useMemo(() => {
    return SPENDWISE_MCP_TOOLS_CATALOG.filter((tool) => {
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
      if (toolSearch.trim()) {
        const q = toolSearch.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.summary.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, toolSearch]);

  const activeToolSpec = useMemo(() => {
    return DETAILED_TOOL_SPECS[selectedToolName] || {
      description: 'SpendWise Model Context Protocol Tool.',
      params: (SPENDWISE_MCP_TOOLS_CATALOG.find((t) => t.name === selectedToolName)?.params || []).map((p) => ({
        name: p,
        type: 'string',
        required: false,
        desc: `Parameter: ${p}`,
      })),
      sampleRequest: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: selectedToolName, arguments: {} },
      },
      sampleResponse: {
        success: true,
        message: `Executed ${selectedToolName} successfully.`,
      },
    };
  }, [selectedToolName]);

  const handleRunConsoleTest = async () => {
    setConsoleRunning(true);
    setConsoleResponse(null);
    setConsoleError(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(consoleArgs || '{}');
    } catch (e) {
      setConsoleError(`Invalid JSON in arguments: ${e.message}`);
      setConsoleRunning(false);
      return;
    }

    try {
      const endpoint = `${getEffectiveApiUrl()}/api/mcp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKeyInput ? { Authorization: `Bearer ${apiKeyInput.trim()}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: consoleTool,
            arguments: parsedArgs,
          },
        }),
      });

      const json = await res.json();
      setConsoleResponse(json);
    } catch (err) {
      setConsoleError(`Network or Server Error: ${err.message}`);
    } finally {
      setConsoleRunning(false);
    }
  };

  const handleSelectToolForConsole = (toolName) => {
    setConsoleTool(toolName);
    const spec = DETAILED_TOOL_SPECS[toolName];
    if (spec && spec.sampleRequest?.params?.arguments) {
      setConsoleArgs(JSON.stringify(spec.sampleRequest.params.arguments, null, 2));
    } else {
      setConsoleArgs('{}');
    }
    setActiveTab('console');
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] antialiased flex flex-col">
      {/* ── STICKY TOP BAR ── */}
      <header className="sticky top-0 z-40 h-14 bg-[var(--bg)]/90 backdrop-blur-[8px] border-b border-[var(--line)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="Back to SpendWise">
              <SpendWiseLogo size={26} />
              <span className="font-semibold text-[var(--ink)] text-base tracking-tight">SpendWise</span>
            </Link>
            <span className="text-xs text-[var(--ink-3)]">/</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[var(--sunken)] text-[var(--accent)]">
              Developer Portal (/dev)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1120px] mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)]">
              Model Context Protocol (MCP) v2.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--credit-soft)] text-[var(--credit)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 26 Tools Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--sunken)] text-[var(--ink-2)]">
              Stdio & HTTP JSON-RPC 2.0
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
            SpendWise Developer & MCP Documentation
          </h1>
          <p className="text-sm text-[var(--ink-2)] max-w-2xl leading-relaxed">
            Integrate autonomous AI assistants, Telegram bots, Claude Desktop, Cursor, and custom scripts into SpendWise.
            Query transactions, record expenses with dual-wallet deductions, analyze monthly budgets, and manage multi-asset portfolios via standard JSON-RPC 2.0.
          </p>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--line)] overflow-x-auto" role="tablist">
            {[
              { id: 'overview', label: 'Overview & Architecture' },
              { id: 'clients', label: 'Client Setup (Telegram, Claude, Cursor)' },
              { id: 'tools', label: 'Tool Reference (26 Tools)' },
              { id: 'console', label: 'Interactive API Console' },
              { id: 'faq', label: 'Consistency & FAQ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-[6px] whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] font-medium'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* TAB 1: OVERVIEW & ARCHITECTURE */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Zap className="w-4 h-4 text-[var(--accent)]" />
                  <span>Dual Transport</span>
                </div>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed">
                  Connect locally via stdio with <span className="font-sans text-[var(--ink)]">node mcp/server.js</span> for Claude Desktop, or over HTTPS with streamable JSON-RPC 2.0 at <span className="font-sans text-[var(--ink)]">/api/mcp</span>.
                </p>
              </div>

              <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--credit)]" />
                  <span>SHA-256 Auth</span>
                </div>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed">
                  Keys are generated client-side with <span className="font-sans text-[var(--ink)]">spw_live_...</span> prefix. Raw keys are never stored in plaintext; only cryptographically secure SHA-256 hashes are persisted.
                </p>
              </div>

              <div className="p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  <span>100% Data Parity</span>
                </div>
                <p className="text-xs text-[var(--ink-3)] leading-relaxed">
                  All MCP calculations use the exact same calendar date parsing and wallet calibration rules as the SpendWise web dashboard. Zero drift, zero phantom sums.
                </p>
              </div>
            </div>

            {/* HTTP Endpoint Spec */}
            <div className="p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-4">
              <h3 className="text-base font-semibold text-[var(--ink)]">HTTP JSON-RPC 2.0 Protocol</h3>
              <p className="text-xs text-[var(--ink-2)]">
                The SpendWise MCP remote server exposes an industry-standard JSON-RPC 2.0 POST endpoint:
              </p>

              <div className="p-3 rounded-[6px] bg-[var(--sunken)] flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--ink)]">POST {getEffectiveApiUrl()}/api/mcp</span>
                <span className="text-[var(--ink-3)]">Headers: Authorization: Bearer &lt;key&gt;</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--ink)]">Supported Methods</div>
                <ul className="text-xs text-[var(--ink-2)] space-y-1 list-disc pl-5">
                  <li><strong className="text-[var(--ink)]">tools/list</strong>: Returns manifest and JSON schema for all 26 available tools.</li>
                  <li><strong className="text-[var(--ink)]">tools/call</strong>: Executes a tool with arguments (e.g. <span className="text-[var(--accent)]">add_transaction</span>, <span className="text-[var(--accent)]">get_summary</span>, <span className="text-[var(--accent)]">add_investment</span>).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT CONFIGURATIONS */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Client selector tabs */}
            <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
              {CLIENT_GUIDES.map((client) => {
                const Icon = client.icon;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClient(client.id)}
                    className={`px-3 py-2 text-xs rounded-[6px] flex items-center gap-2 transition-colors cursor-pointer ${
                      selectedClient === client.id
                        ? 'bg-[var(--surface)] border border-[var(--line)] font-semibold text-[var(--ink)] shadow-sm'
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{client.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Client Details */}
            {(() => {
              const client = CLIENT_GUIDES.find((c) => c.id === selectedClient) || CLIENT_GUIDES[0];
              return (
                <div className="p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--ink)]">{client.title} Configuration</h3>
                      <p className="text-xs text-[var(--ink-2)] mt-0.5">{client.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(client.code, client.id)}
                      className="btn btn-quiet h-8 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSection === client.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--credit)]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 rounded-[6px] bg-[var(--sunken)] text-xs text-[var(--ink)] overflow-x-auto leading-relaxed whitespace-pre font-sans">
                    {client.code}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: TOOLS CATALOG */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search 26 tools..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="field h-9 pl-9 pr-3 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[var(--accent)] text-[var(--on-accent)] font-medium'
                        : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {cat === 'all' ? 'All categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Tool list left, Detail spec right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Tool list (5 cols) */}
              <div className="lg:col-span-5 divide-y divide-[var(--line)] border border-[var(--line)] rounded-[10px] bg-[var(--surface)] overflow-hidden max-h-[600px] overflow-y-auto">
                {filteredTools.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setSelectedToolName(t.name)}
                    className={`w-full p-3 text-left transition-colors cursor-pointer flex items-center justify-between ${
                      selectedToolName === t.name ? 'bg-[var(--sunken)]' : 'hover:bg-[var(--sunken)]/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--ink)]">{t.name}</div>
                      <div className="text-xs text-[var(--ink-3)] truncate max-w-[240px] mt-0.5">{t.summary}</div>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)]">
                      {t.tag}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tool spec sheet (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--ink)]">{selectedToolName}</h3>
                    <p className="text-xs text-[var(--ink-2)] mt-1">{activeToolSpec.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectToolForConsole(selectedToolName)}
                    className="btn btn-primary h-8 px-3 text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test in console</span>
                  </button>
                </div>

                {/* Parameters table */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--ink)]">Arguments</div>
                  {activeToolSpec.params.length === 0 ? (
                    <div className="text-xs text-[var(--ink-3)] py-2">No arguments required.</div>
                  ) : (
                    <div className="border border-[var(--line)] rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--sunken)] text-[var(--ink-3)] font-normal border-b border-[var(--line)]">
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Required</th>
                            <th className="p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {activeToolSpec.params.map((p) => (
                            <tr key={p.name}>
                              <td className="p-2 font-medium text-[var(--ink)]">{p.name}</td>
                              <td className="p-2 text-[var(--ink-3)]">{p.type}</td>
                              <td className="p-2 text-[var(--ink-3)]">{p.required ? 'Yes' : 'No'}</td>
                              <td className="p-2 text-[var(--ink-2)]">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sample JSON-RPC request */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink)]">Example JSON-RPC Request</span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(activeToolSpec.sampleRequest, null, 2), 'sampleReq')
                      }
                      className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      {copiedSection === 'sampleReq' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-[6px] bg-[var(--sunken)] text-xs text-[var(--ink)] overflow-x-auto whitespace-pre font-sans">
                    {JSON.stringify(activeToolSpec.sampleRequest, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTERACTIVE API CONSOLE */}
        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--ink)]">Live MCP Tool Execution Console</h3>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  Execute live JSON-RPC tool calls against <span className="text-[var(--ink)] font-sans">/api/mcp</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Tool name</label>
                  <CustomSelect
                    value={consoleTool}
                    onChange={(e) => handleSelectToolForConsole(e.target.value)}
                    className="h-9 text-xs w-full"
                  >
                    {SPENDWISE_MCP_TOOLS_CATALOG.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="field-label">SpendWise API key (spw_live_...)</label>
                  <input
                    type="password"
                    placeholder="Enter your key from Settings -> API keys"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="field h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Arguments JSON</label>
                <textarea
                  rows={4}
                  value={consoleArgs}
                  onChange={(e) => setConsoleArgs(e.target.value)}
                  className="field text-xs font-sans p-3"
                  placeholder="{}"
                />
              </div>

              <button
                type="button"
                onClick={handleRunConsoleTest}
                disabled={consoleRunning}
                className="btn btn-primary h-9 px-4 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{consoleRunning ? 'Executing...' : 'Run tool call'}</span>
              </button>

              {consoleError && (
                <div className="p-3 rounded-[6px] bg-[var(--debit-soft)] border border-[var(--debit)]/20 text-xs text-[var(--debit)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{consoleError}</span>
                </div>
              )}

              {consoleResponse && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--ink)]">Response Output</div>
                  <pre className="p-3 rounded-[6px] bg-[var(--sunken)] text-xs text-[var(--ink)] overflow-x-auto whitespace-pre font-sans max-h-80">
                    {JSON.stringify(consoleResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CONSISTENCY & FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-4">
              <h3 className="text-base font-semibold text-[var(--ink)]">Why did my Telegram bot show a different sum than Dashboard?</h3>
              <div className="text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
                <p>
                  <strong>Root cause identified & resolved:</strong> When servers or clients in timezones ahead of UTC (such as India Standard Time, UTC+05:30) calculated the first day of the month using UTC serialization (<span className="text-[var(--ink)] font-sans">new Date(year, month, 1).toISOString()</span>), the UTC timestamp resolved to 6:30 PM on the final day of the previous month (e.g. <span className="text-[var(--ink)] font-sans">2026-10-31</span>).
                </p>
                <p>
                  This inadvertently caused an October 31st expense of ₹200 to be included in the MCP query range (<span className="text-[var(--ink)] font-sans">date &gt;= 2026-10-31</span>), returning ₹5,031 while the web dashboard correctly filtered for November expenses (<span className="text-[var(--ink)] font-sans">2026-11</span>) at ₹4,831.00.
                </p>
                <p>
                  <strong>Permanent fix:</strong> SpendWise MCP now employs strict local calendar month prefix boundaries (<span className="text-[var(--ink)] font-sans">YYYY-MM-01</span> to <span className="text-[var(--ink)] font-sans">YYYY-MM-lastDay</span>) and verifies that all transactions start with the local month prefix. Both the Dashboard and all MCP tools are now 100% mathematically and chronologically synchronized.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-4">
              <h3 className="text-base font-semibold text-[var(--ink)]">How are Fixed Deposits (FDs) handled in SpendWise?</h3>
              <div className="text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
                <p>
                  Fixed Deposits are recorded under the <span className="text-[var(--ink)] font-sans">fd</span> asset type. You can supply annual interest rates (e.g. 7.5% p.a.), maturity dates, principal amounts, and bank providers.
                </p>
                <p>
                  The desktop holdings table displays FD metadata directly under the holding name, and the responsive card view and bottom sheet reveal complete maturity timelines.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--line)] py-6 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] text-xs text-[var(--ink-3)] text-center">
        SpendWise MCP Server v2.0 · Model Context Protocol Specification Compliant · 26 Tools Ready
      </footer>
    </div>
  );
}
