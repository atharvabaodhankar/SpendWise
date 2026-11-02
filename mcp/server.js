#!/usr/bin/env node
/**
 * SpendWise Model Context Protocol (MCP) Server
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
  name: 'spendwise',
  version: '1.0.0',
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

// 1. Tool: add_transaction
server.tool(
  'add_transaction',
  'Log an expense or income transaction in SpendWise. Automatically adjusts online or cash balance.',
  {
    amount: z.number().describe('The amount of the transaction (e.g. 450 or 12.50)'),
    type: z.enum(['expense', 'income']).default('expense').describe('Transaction type'),
    category: z.string().default('Other').describe('Category (e.g. Food & Dining, Shopping, Transport)'),
    paymentMethod: z.enum(['online', 'cash']).default('online').describe('Wallet: online or cash'),
    description: z.string().optional().describe('Description, merchant name, or note'),
    date: z.string().optional().describe('YYYY-MM-DD date (defaults to today)'),
    affectCurrentBalance: z.boolean().default(true).describe('Whether to update wallet balance'),
  },
  async (args) => {
    try {
      const result = await callSpendWiseApi('add_transaction', args);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to add transaction: ${err.message}` }] };
    }
  }
);

// 2. Tool: get_summary
server.tool(
  'get_summary',
  'Get current balances (online and cash), monthly spend, and budget progress from SpendWise.',
  {},
  async () => {
    try {
      const result = await callSpendWiseApi('get_summary', {});
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to fetch summary: ${err.message}` }] };
    }
  }
);

// 3. Tool: list_transactions
server.tool(
  'list_transactions',
  'List recent transactions with optional category, type, and keyword filters.',
  {
    limit: z.number().default(10).describe('Max number of transactions (default 10)'),
    category: z.string().optional().describe('Filter by category'),
    type: z.enum(['expense', 'income']).optional().describe('Filter by expense or income'),
    search: z.string().optional().describe('Search keyword in description or category'),
  },
  async (args) => {
    try {
      const result = await callSpendWiseApi('list_transactions', args);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to list transactions: ${err.message}` }] };
    }
  }
);

// 4. Tool: split_expense
server.tool(
  'split_expense',
  'Split an expense with friends: logs personal share, adjusts wallet, and creates debt records.',
  {
    totalAmount: z.number().describe('Total amount paid'),
    description: z.string().describe('What was split (e.g. Dinner)'),
    friendEmails: z.array(z.string()).describe('List of friend email addresses'),
    paymentMethod: z.enum(['online', 'cash']).default('online').describe('Wallet used to pay'),
    category: z.string().default('Food & Dining').describe('Category'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
  },
  async (args) => {
    try {
      const result = await callSpendWiseApi('split_expense', args);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to split expense: ${err.message}` }] };
    }
  }
);

// 5. Tool: get_debts
server.tool(
  'get_debts',
  'View bill split debts: who owes you money and who you owe money to.',
  {
    filter: z.enum(['all', 'you_owe', 'owed_to_you']).default('all').describe('Filter debts'),
  },
  async (args) => {
    try {
      const result = await callSpendWiseApi('get_debts', args);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to fetch debts: ${err.message}` }] };
    }
  }
);

// 6. Tool: settle_debt
server.tool(
  'settle_debt',
  'Mark a debt as paid (debtor) or confirm receipt (creditor).',
  {
    debtId: z.string().describe('The ID of the debt record'),
    action: z.enum(['mark_paid', 'confirm_receipt']).describe('Action to take'),
  },
  async (args) => {
    try {
      const result = await callSpendWiseApi('settle_debt', args);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `Failed to settle debt: ${err.message}` }] };
    }
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 SpendWise MCP server running on stdio');
}

run().catch((err) => {
  console.error('Fatal MCP server error:', err);
  process.exit(1);
});
