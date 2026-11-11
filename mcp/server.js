#!/usr/bin/env node
/**
 * SpendWise Model Context Protocol (MCP) Stdio Server
 * Bridges Claude Desktop, Cursor, Antigravity, and AI agents to SpendWise via stdio.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiKey = process.env.SPENDWISE_API_KEY;
const apiUrl = (process.env.SPENDWISE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

if (!apiKey) {
  console.error('❌ Error: SPENDWISE_API_KEY environment variable is required.');
  console.error('Please generate an API key in your SpendWise Dashboard Settings -> "API & MCP Keys" tab.');
  process.exit(1);
}

const server = new McpServer({
  name: 'spendwise-mcp',
  version: '2.0.0',
});

// Helper to proxy tool call to SpendWise API
async function callSpendWiseApi(toolName, args) {
  const endpoint = `${apiUrl}/api/mcp`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SpendWise API returned HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || 'Unknown API error');
  }

  const contentText = json.result?.content?.[0]?.text;
  return contentText || JSON.stringify(json.result);
}

function handleToolExecution(toolName) {
  return async (args) => {
    try {
      const result = await callSpendWiseApi(toolName, args || {});
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to execute ${toolName}: ${err.message}` }] };
    }
  };
}

// -------------------------------------------------------------
// 1. TRANSACTIONS
// -------------------------------------------------------------

server.tool(
  'add_transaction',
  'Log an expense or income transaction in SpendWise. Automatically adjusts online or cash balance and updates budget tracking.',
  {
    amount: z.number().describe('Amount of transaction (positive number)'),
    type: z.enum(['expense', 'income']).default('expense').describe('Transaction type: expense or income'),
    category: z.string().default('Other').describe('Category (e.g. Food & Dining, Shopping, Transport, Bills & Utilities)'),
    paymentMethod: z.enum(['online', 'cash']).default('online').describe('Payment wallet: online or cash'),
    description: z.string().optional().describe('Description, merchant name, or note'),
    date: z.string().optional().describe('YYYY-MM-DD date (defaults to today)'),
    affectCurrentBalance: z.boolean().default(true).describe('Whether to update wallet balance'),
  },
  handleToolExecution('add_transaction')
);

server.tool(
  'list_transactions',
  'Query recent transactions in SpendWise with optional category, type, date range, and keyword search filters.',
  {
    limit: z.number().default(15).describe('Max number of transactions (default 15, max 100)'),
    category: z.string().optional().describe('Filter by category'),
    type: z.enum(['expense', 'income']).optional().describe('Filter by expense or income'),
    startDate: z.string().optional().describe('Start date filter YYYY-MM-DD'),
    endDate: z.string().optional().describe('End date filter YYYY-MM-DD'),
    search: z.string().optional().describe('Search keyword in description or category'),
  },
  handleToolExecution('list_transactions')
);

server.tool(
  'get_transaction',
  'Retrieve full details of a specific transaction by its unique ID.',
  {
    transactionId: z.string().describe('The unique ID of the transaction'),
  },
  handleToolExecution('get_transaction')
);

server.tool(
  'update_transaction',
  'Update an existing transaction (amount, category, description, date, paymentMethod, type). Automatically reconciles wallet balances.',
  {
    transactionId: z.string().describe('Unique ID of transaction to update'),
    amount: z.number().optional().describe('New amount'),
    type: z.enum(['expense', 'income']).optional().describe('New type: expense or income'),
    category: z.string().optional().describe('New category'),
    description: z.string().optional().describe('New description'),
    date: z.string().optional().describe('New date YYYY-MM-DD'),
    paymentMethod: z.enum(['online', 'cash']).optional().describe('New wallet: online or cash'),
  },
  handleToolExecution('update_transaction')
);

server.tool(
  'delete_transaction',
  'Delete a transaction by ID. Safely restores or reverses wallet balances if applicable.',
  {
    transactionId: z.string().describe('Unique ID of transaction to delete'),
  },
  handleToolExecution('delete_transaction')
);

// -------------------------------------------------------------
// 2. BALANCES & FINANCIAL OVERVIEW
// -------------------------------------------------------------

server.tool(
  'get_summary',
  'Get comprehensive financial overview for user: current online & cash balances, monthly budget progress, and current month total spending/income.',
  {},
  handleToolExecution('get_summary')
);

server.tool(
  'update_balances',
  'Set or adjust current Online (digital/bank) and Cash balances in SpendWise.',
  {
    online: z.number().optional().describe('Online balance amount to set or delta to adjust'),
    cash: z.number().optional().describe('Cash balance amount to set or delta to adjust'),
    mode: z.enum(['set', 'adjust']).default('set').describe('"set" to overwrite balance; "adjust" to add/subtract delta'),
  },
  handleToolExecution('update_balances')
);

// -------------------------------------------------------------
// 3. BUDGETS
// -------------------------------------------------------------

server.tool(
  'get_budget',
  'Fetch current monthly budget limit, spending progress so far this month, remaining allowance, and budget health status.',
  {},
  handleToolExecution('get_budget')
);

server.tool(
  'set_budget',
  'Set or update the monthly spending budget limit in SpendWise.',
  {
    monthlyLimit: z.number().describe('Monthly spending limit in rupees/currency (must be positive)'),
  },
  handleToolExecution('set_budget')
);

// -------------------------------------------------------------
// 4. RECURRING TRANSACTIONS
// -------------------------------------------------------------

server.tool(
  'list_recurring_transactions',
  'List all recurring subscriptions, bills, rent, and scheduled expenses or incomes.',
  {
    type: z.enum(['expense', 'income']).optional().describe('Filter by expense or income'),
  },
  handleToolExecution('list_recurring_transactions')
);

server.tool(
  'add_recurring_transaction',
  'Schedule a recurring transaction (e.g. Netflix, rent, gym membership, or salary).',
  {
    amount: z.number().describe('Recurring amount'),
    category: z.string().describe('Category (e.g. Bills, Subscription, Rent)'),
    description: z.string().describe('Name of recurring item (e.g. "Spotify Premium")'),
    frequency: z.enum(['weekly', 'monthly', 'yearly']).default('monthly').describe('Recurrence interval'),
    type: z.enum(['expense', 'income']).default('expense').describe('Type: expense or income'),
    paymentMethod: z.enum(['online', 'cash']).default('online').describe('Wallet to pay from'),
  },
  handleToolExecution('add_recurring_transaction')
);

server.tool(
  'delete_recurring_transaction',
  'Delete a scheduled recurring transaction by ID.',
  {
    recurringId: z.string().describe('Unique ID of recurring item to delete'),
  },
  handleToolExecution('delete_recurring_transaction')
);

// -------------------------------------------------------------
// 5. SOCIAL BILL SPLITTING & DEBTS
// -------------------------------------------------------------

server.tool(
  'split_expense',
  'Split an expense with friends: logs personal share, adjusts wallet by total paid, and creates debt records.',
  {
    totalAmount: z.number().describe('Total amount paid'),
    description: z.string().describe('What was split (e.g. "Dinner at Burma Burma")'),
    friendEmails: z.array(z.string()).describe('List of friend email addresses'),
    paymentMethod: z.enum(['online', 'cash']).default('online').describe('Wallet used to pay total'),
    category: z.string().default('Food & Dining').describe('Category'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
  },
  handleToolExecution('split_expense')
);

server.tool(
  'get_debts',
  'View bill split debts: see who owes you money ("Owed to You"), who you owe money to ("You Owe"), and net balance.',
  {
    filter: z.enum(['all', 'you_owe', 'owed_to_you']).default('all').describe('Filter debts'),
  },
  handleToolExecution('get_debts')
);

server.tool(
  'settle_debt',
  'Mark a debt as paid (debtor action) or confirm receipt of payment (creditor action).',
  {
    debtId: z.string().describe('The ID of the debt record'),
    action: z.enum(['mark_paid', 'confirm_receipt']).describe('Action: mark_paid or confirm_receipt'),
  },
  handleToolExecution('settle_debt')
);

// -------------------------------------------------------------
// 6. FRIENDS
// -------------------------------------------------------------

server.tool(
  'list_friends',
  'List user connected friends with display names and email addresses.',
  {},
  handleToolExecution('list_friends')
);

server.tool(
  'add_friend',
  'Add a friend by email address to split bills with in SpendWise.',
  {
    email: z.string().describe("Friend's registered email address"),
    displayName: z.string().optional().describe('Optional nickname for friend'),
  },
  handleToolExecution('add_friend')
);

// -------------------------------------------------------------
// 7. INVESTMENTS & PORTFOLIO
// -------------------------------------------------------------

server.tool(
  'list_investments',
  'List all investment holdings (Gold, Silver, Mutual Funds, Fixed Deposits, Stocks, Crypto, Other) with P&L.',
  {
    assetType: z.enum(['gold', 'silver', 'mutual_fund', 'fd', 'stocks', 'crypto', 'other']).optional().describe('Optional asset filter'),
  },
  handleToolExecution('list_investments')
);

server.tool(
  'add_investment',
  'Log an investment holding in SpendWise (e.g. Mutual Fund SIP, Digital Gold, Stock, Fixed Deposit).',
  {
    name: z.string().describe('Name of investment (e.g. "Parag Parikh Flexi Cap", "24K Digital Gold")'),
    assetType: z.enum(['gold', 'silver', 'mutual_fund', 'fd', 'stocks', 'crypto', 'other']).describe('Asset category'),
    investedAmount: z.number().describe('Total amount invested'),
    currentValue: z.number().optional().describe('Current market value of holding'),
    provider: z.string().default('Direct').describe('Platform or broker (e.g. Zerodha, Groww, PhonePe)'),
    purchaseDate: z.string().optional().describe('Purchase date YYYY-MM-DD'),
    maturityDate: z.string().optional().describe('Maturity date YYYY-MM-DD (for FDs or bonds)'),
    interestRate: z.number().optional().describe('Annual interest rate percentage'),
    units: z.number().optional().describe('Units, shares, or grams owned'),
    notes: z.string().optional().describe('Optional notes or folio number'),
  },
  handleToolExecution('add_investment')
);

server.tool(
  'update_investment',
  'Update current market valuation, units, or notes for an investment holding.',
  {
    investmentId: z.string().describe('Unique ID of investment to update'),
    currentValue: z.number().optional().describe('Updated current market value'),
    investedAmount: z.number().optional().describe('Updated invested principal'),
    units: z.number().optional().describe('Updated units'),
    notes: z.string().optional().describe('Updated notes'),
  },
  handleToolExecution('update_investment')
);

server.tool(
  'delete_investment',
  'Delete an investment holding record by ID.',
  {
    investmentId: z.string().describe('Unique ID of investment to delete'),
  },
  handleToolExecution('delete_investment')
);

server.tool(
  'get_portfolio_summary',
  'Calculate complete investment portfolio summary: total invested, current valuation, net profit/loss, ROI %, and asset allocation.',
  {},
  handleToolExecution('get_portfolio_summary')
);

// -------------------------------------------------------------
// 8. SALARY TRACKING
// -------------------------------------------------------------

server.tool(
  'list_salaries',
  'List recorded salary credits and payroll history.',
  {
    limit: z.number().default(12).describe('Max salary records to return'),
  },
  handleToolExecution('list_salaries')
);

server.tool(
  'add_salary',
  'Log a monthly salary receipt or compensation credit in SpendWise.',
  {
    salaryMonth: z.string().describe('Salary month (e.g. "July 2026")'),
    amount: z.number().describe('Net salary amount credited'),
    receivedDate: z.string().optional().describe('Credit date YYYY-MM-DD'),
    companyOrSource: z.string().optional().describe('Employer or company name'),
    status: z.enum(['received', 'pending']).default('received').describe('Status: received or pending'),
    notes: z.string().optional().describe('Optional note'),
  },
  handleToolExecution('add_salary')
);

server.tool(
  'delete_salary',
  'Delete a salary record by ID.',
  {
    salaryId: z.string().describe('Unique ID of salary record to delete'),
  },
  handleToolExecution('delete_salary')
);

// -------------------------------------------------------------
// 9. ANALYTICS & REPORTS
// -------------------------------------------------------------

server.tool(
  'get_analytics',
  'Generate deep financial analytics: category breakdown %, online vs cash wallet ratio, 6-month trends, daily average spend, and peak spending days.',
  {
    month: z.string().optional().describe('Target month YYYY-MM (e.g. "2026-07") or "all"'),
  },
  handleToolExecution('get_analytics')
);

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 SpendWise MCP server running on stdio with 26 tools ready.');
}

run().catch((err) => {
  console.error('Fatal MCP server error:', err);
  process.exit(1);
});
