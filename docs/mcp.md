# SpendWise Model Context Protocol (MCP) Documentation

> **Protocol Version:** `2024-11-05`  
> **Server Implementation:** `spendwise-mcp v2.0.0`  
> **Transport Protocols:** Remote HTTP/JSON-RPC 2.0 (`/api/mcp`) & Local Stdio (`npx spendwise-mcp`)  
> **Authentication:** Bearer Token (`spw_live_...`), SHA-256 Hashed  

SpendWise connects natively to LLM assistants—including **Claude Desktop**, **Cursor**, **Windsurf**, **Google Antigravity**, and autonomous agents—via the **Model Context Protocol (MCP)**. This turns SpendWise into an AI-native financial copilot capable of managing transactions, dual wallet balances, social bill splits, mutual fund/gold portfolios, monthly budgets, and deep analytics through natural conversation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security & Authentication](#security--authentication)
3. [Quick Setup Guides](#quick-setup-guides)
   - [Claude Desktop](#1-claude-desktop)
   - [Cursor & Windsurf](#2-cursor--windsurf)
   - [Google Antigravity / Gemini CLI](#3-google-antigravity--gemini-cli)
   - [cURL & Direct HTTP Testing](#4-curl--direct-http-testing)
   - [Python / Node.js Agent Integration](#5-python--nodejs-agent-integration)
4. [Complete MCP Tool Reference (26 Tools)](#complete-mcp-tool-reference-26-tools)
   - [1. Transactions (5 Tools)](#1-transactions)
   - [2. Balances & Financial Overview (2 Tools)](#2-balances--financial-overview)
   - [3. Budgets & Spending Limits (2 Tools)](#3-budgets--spending-limits)
   - [4. Recurring Transactions & Bills (3 Tools)](#4-recurring-transactions--bills)
   - [5. Social Ledger, Friends & Debts (5 Tools)](#5-social-ledger-friends--debts)
   - [6. Investments & Portfolio (5 Tools)](#6-investments--portfolio)
   - [7. Salary & Income Tracking (3 Tools)](#7-salary--income-tracking)
   - [8. Deep Analytics & Insights (1 Tool)](#8-deep-analytics--insights)
5. [Natural Language Prompt Examples](#natural-language-prompt-examples)
6. [Error Codes & Troubleshooting](#error-codes--troubleshooting)

---

## Architecture Overview

SpendWise offers dual MCP connectivity:

```
┌────────────────────────────────────────────────────────┐
│  AI Clients: Claude Desktop, Cursor, Antigravity, SDK │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ Remote HTTP MCP ]           [ Local Stdio MCP ]
   POST https://spendwise.app/api/mcp    node mcp/server.js
             │                           │ (Proxies to API)
             └─────────────┬─────────────┘
                           ▼
            ┌─────────────────────────────┐
            │   SpendWise Core Engine     │
            │   - 26 Financial Tools      │
            │   - SHA-256 Auth Guard      │
            │   - Firestore Ledger        │
            └─────────────────────────────┘
```

1. **Remote HTTP Transport (`/api/mcp`)**: Serverless Vercel endpoint accepting standard JSON-RPC 2.0 requests over HTTP with `Authorization: Bearer spw_live_...`.
2. **Local Stdio Transport (`mcp/server.js`)**: Stdio wrapper using `@modelcontextprotocol/sdk` for clients that launch local sub-processes. Proxies requests securely to your SpendWise instance.

---

## Security & Authentication

- **Key Generation:** Generate keys directly from **Dashboard → Settings → API & MCP Keys**. Keys follow the format `spw_live_<48 hex chars>`.
- **Zero Plaintext Storage:** Keys are hashed client-side with SHA-256 before being committed to Firestore. SpendWise servers never store your plaintext secret key.
- **Strict Scope Isolation:** Every tool execution is strictly scoped to the authenticated `userId`. No agent can inspect or modify records belonging to other users.
- **Instant Revocation:** Revoking a key from the dashboard invalidates all future agent requests immediately.

---

## Quick Setup Guides

### 1. Claude Desktop

#### Option A: Remote URL (Recommended)
Edit your Claude Desktop configuration file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the SpendWise server under `mcpServers`:

```json
{
  "mcpServers": {
    "spendwise": {
      "url": "https://your-spendwise-domain.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY"
      }
    }
  }
}
```

#### Option B: Stdio Transport (Local Runner)
If using Claude with the local stdio runner:

```json
{
  "mcpServers": {
    "spendwise": {
      "command": "node",
      "args": ["/absolute/path/to/SpendWise/mcp/server.js"],
      "env": {
        "SPENDWISE_API_KEY": "spw_live_YOUR_SECRET_KEY",
        "SPENDWISE_API_URL": "https://your-spendwise-domain.vercel.app"
      }
    }
  }
}
```

---

### 2. Cursor & Windsurf

In your project root, create or edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "spendwise": {
      "url": "https://your-spendwise-domain.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY"
      }
    }
  }
}
```

For **Windsurf**, place the configuration in `~/.codeium/windsurf/mcp_config.json` (or `%USERPROFILE%\.codeium\windsurf\mcp_config.json` on Windows) with `"serverUrl"` instead of `"url"`.

---

### 3. Google Antigravity / Gemini CLI

Add via the Antigravity CLI:

```bash
agy mcp add spendwise --url "https://your-spendwise-domain.vercel.app/api/mcp" --header "Authorization=Bearer spw_live_YOUR_SECRET_KEY"
```

Or manually configure in `~/.gemini/antigravity/mcp.json`:

```json
{
  "mcpServers": {
    "spendwise": {
      "url": "https://your-spendwise-domain.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY"
      }
    }
  }
}
```

---

### 4. cURL & Direct HTTP Testing

Check MCP health and discover tools:

```bash
curl -X GET "https://your-spendwise-domain.vercel.app/api/mcp"
```

Call `get_summary` via JSON-RPC 2.0:

```bash
curl -X POST "https://your-spendwise-domain.vercel.app/api/mcp" \
  -H "Authorization: Bearer spw_live_YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_summary",
      "arguments": {}
    }
  }'
```

---

### 5. Python / Node.js Agent Integration

```python
import requests

def call_spendwise(tool_name, arguments):
    url = "https://your-spendwise-domain.vercel.app/api/mcp"
    headers = {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY",
        "Content-Type": "application/json"
    }
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    res = requests.post(url, headers=headers, json=payload)
    return res.json()["result"]["content"][0]["text"]

# Example: Log a coffee purchase
result = call_spendwise("add_transaction", {
    "amount": 220,
    "category": "Food & Dining",
    "description": "Cappuccino at Blue Tokai",
    "paymentMethod": "online"
})
print(result)
```

---

## Complete MCP Tool Reference (26 Tools)

### 1. Transactions

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `add_transaction` | Mutation | Log an expense or income transaction. Adjusts wallet balance. | `amount`, `type`, `category`, `paymentMethod`, `description`, `date`, `affectCurrentBalance` |
| `list_transactions` | Query | List recent transactions with filters. | `limit`, `category`, `type`, `startDate`, `endDate`, `search` |
| `get_transaction` | Query | Get full details of a transaction by ID. | `transactionId` |
| `update_transaction` | Mutation | Update transaction fields with automatic wallet reconciliation. | `transactionId`, `amount`, `category`, `description`, `date`, `paymentMethod`, `type` |
| `delete_transaction` | Mutation | Delete a transaction and reverse balance change. | `transactionId` |

#### `add_transaction` Input Schema:
```json
{
  "amount": 450,
  "type": "expense",
  "category": "Food & Dining",
  "paymentMethod": "online",
  "description": "Lunch at Olive Garden",
  "date": "2026-07-20",
  "affectCurrentBalance": true
}
```

---

### 2. Balances & Financial Overview

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `get_summary` | Query | Overview of online/cash balances, month spending, and budget status. | _None_ |
| `update_balances` | Mutation | Directly set or adjust cash and online digital wallet balances. | `online`, `cash`, `mode` (`"set"` or `"adjust"`) |

---

### 3. Budgets & Spending Limits

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `get_budget` | Query | Monthly limit, spent so far, remaining allowance, % used. | _None_ |
| `set_budget` | Mutation | Set or update monthly spending ceiling. | `monthlyLimit` |

---

### 4. Recurring Transactions & Bills

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `list_recurring_transactions` | Query | List recurring subscriptions, rent, and scheduled bills. | `type` (`"expense"` or `"income"`) |
| `add_recurring_transaction` | Mutation | Schedule recurring outlays (weekly, monthly, yearly). | `amount`, `category`, `description`, `frequency`, `type`, `paymentMethod` |
| `delete_recurring_transaction` | Mutation | Delete a recurring item by ID. | `recurringId` |

---

### 5. Social Ledger, Friends & Debts

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `split_expense` | Mutation | Split bill with friends: records your share, deducts wallet, creates debts. | `totalAmount`, `description`, `friendEmails`, `paymentMethod`, `category`, `date` |
| `get_debts` | Query | View who owes you ("Owed to You") and who you owe ("You Owe"). | `filter` (`"all"`, `"you_owe"`, `"owed_to_you"`) |
| `settle_debt` | Mutation | Mark paid as debtor or confirm receipt as creditor. | `debtId`, `action` (`"mark_paid"`, `"confirm_receipt"`) |
| `list_friends` | Query | List connected friends and display names. | _None_ |
| `add_friend` | Mutation | Add a friend by email address to enable bill splitting. | `email`, `displayName` |

---

### 6. Investments & Portfolio

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `list_investments` | Query | List all holdings with current value, profit/loss, and ROI %. | `assetType` (`"gold"`, `"silver"`, `"mutual_fund"`, `"fd"`, `"stocks"`, `"crypto"`, `"other"`) |
| `add_investment` | Mutation | Log an investment holding (SIP, digital gold, stock, FD). | `name`, `assetType`, `investedAmount`, `currentValue`, `provider`, `purchaseDate`, `maturityDate`, `interestRate`, `units`, `notes` |
| `update_investment` | Mutation | Update valuation, units, or notes of an investment. | `investmentId`, `currentValue`, `investedAmount`, `units`, `notes` |
| `delete_investment` | Mutation | Delete an investment holding from portfolio. | `investmentId` |
| `get_portfolio_summary` | Query | Portfolio totals: invested, current value, total P&L, ROI %, asset allocation. | _None_ |

---

### 7. Salary & Income Tracking

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `list_salaries` | Query | List salary payment records and pay history. | `limit` |
| `add_salary` | Mutation | Log monthly salary credit with employer, month, and amount. | `salaryMonth`, `amount`, `receivedDate`, `companyOrSource`, `status`, `notes` |
| `delete_salary` | Mutation | Delete a salary record by ID. | `salaryId` |

---

### 8. Deep Analytics & Insights

| Tool | Type | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `get_analytics` | Query | Category spend %, cash vs online ratio, 6-month trend, daily average. | `month` (`"YYYY-MM"` or `"all"`) |

---

## Natural Language Prompt Examples

Once connected, your AI assistant will invoke the right SpendWise tools automatically:

| What You Say to Your AI | MCP Tool Invoked |
| :--- | :--- |
| *"I just paid ₹450 for groceries on Blinkit via UPI"* | `add_transaction` |
| *"Split ₹3,600 dinner with rahul@gmail.com and sneha@gmail.com"* | `split_expense` |
| *"Who owes me money and who do I owe?"* | `get_debts` |
| *"Mark my ₹1,200 debt to Rahul as paid"* | `settle_debt` |
| *"Set my monthly budget to ₹40,000"* | `set_budget` |
| *"How much budget do I have left for this month?"* | `get_budget` |
| *"Log a ₹15,000 monthly SIP in Parag Parikh Flexi Cap via Groww"* | `add_investment` |
| *"What is my total net worth and investment portfolio return?"* | `get_portfolio_summary` |
| *"Log July 2026 salary of ₹1,40,000 from Google"* | `add_salary` |
| *"Where did most of my money go this month?"* | `get_analytics` |
| *"Add a recurring Netflix subscription of ₹649 every month"* | `add_recurring_transaction` |

---

## Error Codes & Troubleshooting

SpendWise MCP returns standard JSON-RPC 2.0 error responses:

| Code | Meaning | Common Cause & Resolution |
| :--- | :--- | :--- |
| `-32001` | Unauthorized | Missing or invalid API key. Verify `Authorization: Bearer spw_live_...` header. |
| `-32601` | Method / Tool Not Found | Tool name mismatch. Ensure you are calling one of the 26 documented tools. |
| `-32602` | Invalid Params | Missing required arguments (e.g. positive `amount` or `transactionId`). |
| `-32603` | Internal Server Error | Database or network error. Verify Firebase configuration in environment. |

### Verifying Connection
If Claude or Cursor cannot see tools:
1. Ensure the URL is `https://<your-domain>/api/mcp` without trailing slashes.
2. Verify that your API key is active in SpendWise Dashboard Settings.
3. Completely restart the client application after editing configuration files.
