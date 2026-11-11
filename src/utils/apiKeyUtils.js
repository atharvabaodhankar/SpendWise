/**
 * SpendWise API Key & MCP Utilities
 * Generates secure API keys, SHA-256 hashes for storage, client configuration templates,
 * and exposes the full 26-tool SpendWise MCP capability catalog.
 */

export function generateApiKey() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `spw_live_${hex}`;
}

export async function hashApiKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatKeyPrefix(key) {
  if (!key || key.length < 16) return key || '';
  const head = key.slice(0, 12);
  const tail = key.slice(-4);
  return `${head}••••${tail}`;
}

export function getEffectiveApiUrl() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://spendwise.app';
}

// -------------------------------------------------------------
// CLIENT CONFIGURATION TEMPLATES
// -------------------------------------------------------------

export function getClaudeDesktopConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          url: `${apiUrl}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function getClaudeDesktopStdioConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          command: 'npx',
          args: ['-y', 'spendwise-mcp'],
          env: {
            SPENDWISE_API_KEY: apiKey,
            SPENDWISE_API_URL: apiUrl,
          },
        },
      },
    },
    null,
    2
  );
}

export function getCursorConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          url: `${apiUrl}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function getAntigravityConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return `# In terminal / command prompt, run:
agy mcp add spendwise --url "${apiUrl}/api/mcp" --header "Authorization=Bearer ${apiKey}"

# Or add to ~/.gemini/antigravity/mcp.json:
{
  "mcpServers": {
    "spendwise": {
      "url": "${apiUrl}/api/mcp",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`;
}

export function getWindsurfConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          serverUrl: `${apiUrl}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function getCurlSnippet(apiKey, apiUrl = getEffectiveApiUrl()) {
  return `curl -X POST "${apiUrl}/api/mcp" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_summary",
      "arguments": {}
    }
  }'`;
}

export function getPythonSnippet(apiKey, apiUrl = getEffectiveApiUrl()) {
  return `import requests

url = "${apiUrl}/api/mcp"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_summary",
        "arguments": {}
    }
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;
}

// -------------------------------------------------------------
// CLIENT CONFIG FILE PATHS BY OS
// -------------------------------------------------------------

export const CLIENT_CONFIG_PATHS = {
  claude: {
    name: 'Claude Desktop',
    windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
    macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
    linux: '~/.config/Claude/claude_desktop_config.json',
  },
  cursor: {
    name: 'Cursor',
    windows: '.cursor/mcp.json (Project Root) or %USERPROFILE%\\.cursor\\mcp.json',
    macos: '.cursor/mcp.json (Project Root) or ~/.cursor/mcp.json',
    linux: '.cursor/mcp.json (Project Root) or ~/.cursor/mcp.json',
  },
  antigravity: {
    name: 'Google Antigravity / Gemini CLI',
    windows: '%USERPROFILE%\\.gemini\\antigravity\\mcp.json',
    macos: '~/.gemini/antigravity/mcp.json',
    linux: '~/.gemini/antigravity/mcp.json',
  },
  windsurf: {
    name: 'Windsurf',
    windows: '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json',
    macos: '~/.codeium/windsurf/mcp_config.json',
    linux: '~/.codeium/windsurf/mcp_config.json',
  },
};

// -------------------------------------------------------------
// SPENDWISE MCP COMPLETE 26-TOOL CATALOG
// -------------------------------------------------------------

export const SPENDWISE_MCP_TOOLS_CATALOG = [
  // Transactions
  {
    name: 'add_transaction',
    category: 'Transactions',
    tag: 'Core',
    summary: 'Log an expense or income transaction with wallet balance deduction.',
    example: '"Add ₹350 for Swiggy dinner paid via UPI"',
    params: ['amount', 'type', 'category', 'paymentMethod', 'description', 'date', 'affectCurrentBalance'],
  },
  {
    name: 'list_transactions',
    category: 'Transactions',
    tag: 'Query',
    summary: 'Query past transactions with category, keyword, and date filters.',
    example: '"Show my last 10 expenses on groceries"',
    params: ['limit', 'category', 'type', 'startDate', 'endDate', 'search'],
  },
  {
    name: 'get_transaction',
    category: 'Transactions',
    tag: 'Query',
    summary: 'Fetch full receipt and metadata of a specific transaction by ID.',
    example: '"Get details of transaction tx_8192a"',
    params: ['transactionId'],
  },
  {
    name: 'update_transaction',
    category: 'Transactions',
    tag: 'Write',
    summary: 'Modify amount, category, or notes with automatic balance reconciliation.',
    example: '"Change yesterday\'s Uber expense amount to ₹420"',
    params: ['transactionId', 'amount', 'category', 'description', 'date', 'paymentMethod'],
  },
  {
    name: 'delete_transaction',
    category: 'Transactions',
    tag: 'Write',
    summary: 'Delete a transaction and restore wallet balance safely.',
    example: '"Delete the accidental ₹5,000 transaction from this morning"',
    params: ['transactionId'],
  },

  // Balances & Summary
  {
    name: 'get_summary',
    category: 'Balances & Budgets',
    tag: 'Overview',
    summary: 'Get current balances (online + cash), monthly spend, and budget progress.',
    example: '"What is my current balance and how much have I spent this month?"',
    params: [],
  },
  {
    name: 'update_balances',
    category: 'Balances & Budgets',
    tag: 'Write',
    summary: 'Directly set or adjust cash and online digital wallet balances.',
    example: '"Set my online balance to ₹45,000 and cash to ₹3,500"',
    params: ['online', 'cash', 'mode'],
  },
  {
    name: 'get_budget',
    category: 'Balances & Budgets',
    tag: 'Query',
    summary: 'Check monthly budget ceiling, spent so far, and remaining allowance.',
    example: '"How much budget do I have left for July?"',
    params: [],
  },
  {
    name: 'set_budget',
    category: 'Balances & Budgets',
    tag: 'Write',
    summary: 'Set or update the monthly spending limit.',
    example: '"Set my monthly expense budget to ₹35,000"',
    params: ['monthlyLimit'],
  },

  // Recurring
  {
    name: 'list_recurring_transactions',
    category: 'Recurring Outlays',
    tag: 'Query',
    summary: 'List active subscriptions, monthly bills, and rent.',
    example: '"What recurring subscriptions do I have active?"',
    params: ['type'],
  },
  {
    name: 'add_recurring_transaction',
    category: 'Recurring Outlays',
    tag: 'Write',
    summary: 'Schedule a recurring payment or income (weekly, monthly, yearly).',
    example: '"Add a monthly ₹799 Netflix subscription due on online wallet"',
    params: ['amount', 'category', 'description', 'frequency', 'paymentMethod'],
  },
  {
    name: 'delete_recurring_transaction',
    category: 'Recurring Outlays',
    tag: 'Write',
    summary: 'Cancel and remove a scheduled recurring transaction.',
    example: '"Cancel my recurring gym membership"',
    params: ['recurringId'],
  },

  // Social Splitting & Debts
  {
    name: 'split_expense',
    category: 'Social Ledger & Debts',
    tag: 'Social',
    summary: 'Split an expense with friends, deduct wallet, and record individual debts.',
    example: '"Split ₹1,800 dinner with rahul@gmail.com and priya@gmail.com"',
    params: ['totalAmount', 'description', 'friendEmails', 'paymentMethod', 'category'],
  },
  {
    name: 'get_debts',
    category: 'Social Ledger & Debts',
    tag: 'Social',
    summary: 'View who owes you money, who you owe, and your net debt position.',
    example: '"Who owes me money right now and what is my net balance?"',
    params: ['filter'],
  },
  {
    name: 'settle_debt',
    category: 'Social Ledger & Debts',
    tag: 'Social',
    summary: 'Mark a debt as paid (debtor) or confirm settlement receipt (creditor).',
    example: '"Mark the ₹600 dinner debt to Rahul as paid"',
    params: ['debtId', 'action'],
  },
  {
    name: 'list_friends',
    category: 'Social Ledger & Debts',
    tag: 'Social',
    summary: 'List all connected bill-splitting friends and their profiles.',
    example: '"Show all my connected friends in SpendWise"',
    params: [],
  },
  {
    name: 'add_friend',
    category: 'Social Ledger & Debts',
    tag: 'Social',
    summary: 'Add a new friend by email address for group expenses.',
    example: '"Add friend rohan@company.com"',
    params: ['email', 'displayName'],
  },

  // Investments & Portfolio
  {
    name: 'list_investments',
    category: 'Investments & Portfolio',
    tag: 'Investments',
    summary: 'List holdings across Gold, Silver, Mutual Funds, Stocks, FDs, and Crypto.',
    example: '"List all my mutual funds and digital gold holdings"',
    params: ['assetType'],
  },
  {
    name: 'add_investment',
    category: 'Investments & Portfolio',
    tag: 'Investments',
    summary: 'Log a new investment purchase or SIP entry.',
    example: '"Log ₹10,000 in Parag Parikh Flexi Cap via Groww"',
    params: ['name', 'assetType', 'investedAmount', 'currentValue', 'provider', 'units'],
  },
  {
    name: 'update_investment',
    category: 'Investments & Portfolio',
    tag: 'Investments',
    summary: 'Update current market valuation, units, or notes of an investment.',
    example: '"Update my gold holding current valuation to ₹48,000"',
    params: ['investmentId', 'currentValue', 'units', 'notes'],
  },
  {
    name: 'delete_investment',
    category: 'Investments & Portfolio',
    tag: 'Investments',
    summary: 'Delete an investment holding from portfolio.',
    example: '"Delete the mature FD record"',
    params: ['investmentId'],
  },
  {
    name: 'get_portfolio_summary',
    category: 'Investments & Portfolio',
    tag: 'Investments',
    summary: 'Calculate total invested capital, current portfolio value, P&L, ROI %, and asset allocation.',
    example: '"What is my overall investment portfolio value and total profit?"',
    params: [],
  },

  // Salary
  {
    name: 'list_salaries',
    category: 'Salary & Income',
    tag: 'Income',
    summary: 'List monthly salary slips and income history.',
    example: '"Show my salary history for the past 6 months"',
    params: ['limit'],
  },
  {
    name: 'add_salary',
    category: 'Salary & Income',
    tag: 'Income',
    summary: 'Record a salary credit with month, employer, and net amount.',
    example: '"Log July 2026 salary of ₹1,25,000 received from Acme Corp"',
    params: ['salaryMonth', 'amount', 'receivedDate', 'companyOrSource', 'status'],
  },
  {
    name: 'delete_salary',
    category: 'Salary & Income',
    tag: 'Income',
    summary: 'Remove an incorrect salary record.',
    example: '"Delete salary entry for June"',
    params: ['salaryId'],
  },

  // Analytics
  {
    name: 'get_analytics',
    category: 'Analytics & Insights',
    tag: 'Analytics',
    summary: 'Deep spend analytics: category %, cash vs online ratio, monthly trends, and daily averages.',
    example: '"Analyze my spending for July: where is most of my money going?"',
    params: ['month'],
  },
];
