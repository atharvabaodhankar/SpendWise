# SpendWise MCP Server 🤖💰

SpendWise includes an official **Model Context Protocol (MCP)** server that turns your personal expense tracker into an AI-powered conversational CFO. Connect it directly to **Claude Desktop**, **Cursor**, **Antigravity**, **Raycast**, or any MCP-compatible client.

---

## ✨ Capabilities

Through your AI assistant, you can:
* **Log Expenses & Income:** *"Spent ₹450 on dinner with card"* or *"Got ₹5,000 freelance payment via UPI"*.
* **Split Bills Instantly:** *"Split ₹1,800 dinner between me and alex@example.com, paid via UPI"*.
* **Real-time Balance & Budget Checks:** *"What is my remaining food budget this month?"* or *"What is my cash balance?"*.
* **Track Debts:** *"Who owes me money right now?"*.
* **Settle Up:** *"Mark the ₹600 concert debt as paid"* or *"Confirm receipt for Rahul's payment"*.

---

## 🔑 1. Generate Your API Key

1. Log in to your **SpendWise Dashboard**.
2. Click the **API & MCP Keys** icon (`Key` icon) in the header navigation (or go to **Settings** → **API Keys & MCP** tab).
3. Click **"Create Secret Key"**.
4. Enter a label (e.g., `Claude Desktop` or `Cursor`) and click **Generate**.
5. Copy your new secret key (`spw_live_...`).

> [!IMPORTANT]
> Your secret key will only be displayed once. Keys are cryptographically hashed with SHA-256 before being stored in Firestore.

---

## ⚙️ 2. Configure Your AI Client

### Option A: Claude Desktop (Remote HTTP / SSE)

Add to your `claude_desktop_config.json`:
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spendwise": {
      "url": "https://your-spendwise-deployment.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY"
      }
    }
  }
}
```

---

### Option B: Claude Desktop (Local stdio Runner)

If your client runs local stdio commands:

```json
{
  "mcpServers": {
    "spendwise": {
      "command": "node",
      "args": ["C:/path/to/SpendWise/mcp/server.js"],
      "env": {
        "SPENDWISE_API_KEY": "spw_live_YOUR_SECRET_KEY",
        "SPENDWISE_API_URL": "https://your-spendwise-deployment.vercel.app"
      }
    }
  }
}
```

---

### Option C: Cursor / Windsurf

Add to `.cursor/mcp.json` in your project root or user settings:

```json
{
  "mcpServers": {
    "spendwise": {
      "url": "https://your-spendwise-deployment.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer spw_live_YOUR_SECRET_KEY"
      }
    }
  }
}
```

---

## 🛠️ Available MCP Tools

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `add_transaction` | `amount`, `type`, `category`, `paymentMethod`, `description`, `date`, `affectCurrentBalance` | Add an expense or income; adjusts current wallet balances. |
| `get_summary` | None | Current cash/online balances, monthly spend, budget progress, top categories. |
| `list_transactions` | `limit`, `category`, `type`, `search` | Filter recent transactions with in-memory fallback. |
| `split_expense` | `totalAmount`, `description`, `friendEmails`, `paymentMethod`, `category`, `date` | Splits bill, logs share, deducts wallet, and creates debt records for friends. |
| `get_debts` | `filter` (`all`, `you_owe`, `owed_to_you`) | Real-time balance sheet of what you owe and what is owed to you. |
| `settle_debt` | `debtId`, `action` (`mark_paid`, `confirm_receipt`) | Debtor marks payment sent; creditor confirms payment received. |

---

## 🧪 Testing with cURL

You can test the MCP endpoint directly using standard JSON-RPC 2.0:

```bash
curl -X POST "https://your-spendwise-deployment.vercel.app/api/mcp" \
  -H "Authorization: Bearer spw_live_YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```
