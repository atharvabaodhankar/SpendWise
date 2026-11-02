import { authenticateApiKey } from './_utils/authApiKey.js';
import { getAdminDb } from './_utils/firebaseAdmin.js';

const SERVER_INFO = {
  name: 'spendwise-mcp',
  version: '1.0.0',
};

const TOOLS = [
  {
    name: 'add_transaction',
    description:
      'Log an expense or income transaction in SpendWise. Automatically adjusts online or cash balance and updates budget tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The amount of the transaction (e.g. 450 or 12.50).',
        },
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'Type of transaction: expense or income. Defaults to expense.',
          default: 'expense',
        },
        category: {
          type: 'string',
          description:
            'Category (e.g. Food & Dining, Shopping, Transport, Entertainment, Bills & Utilities, Groceries, Health, Other).',
          default: 'Other',
        },
        paymentMethod: {
          type: 'string',
          enum: ['online', 'cash'],
          description: 'Payment wallet: online (UPI/Card/Netbanking) or cash. Defaults to online.',
          default: 'online',
        },
        description: {
          type: 'string',
          description: 'Description, merchant name, or note (e.g. "Lunch at Starbucks").',
        },
        date: {
          type: 'string',
          description: 'Date of transaction in YYYY-MM-DD format. Defaults to today.',
        },
        affectCurrentBalance: {
          type: 'boolean',
          description: 'Whether to deduct/add to the wallet balance. Defaults to true.',
          default: true,
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'get_summary',
    description:
      'Get financial summary for the authenticated SpendWise user: current online & cash balances, monthly budget progress, and current month total spending.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_transactions',
    description:
      'Query recent transactions in SpendWise with optional category, type, and keyword search filters.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to return (default: 10, max: 50).',
          default: 10,
        },
        category: {
          type: 'string',
          description: 'Filter by category name (case-insensitive substring).',
        },
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'Filter by expense or income.',
        },
        search: {
          type: 'string',
          description: 'Filter by text in description or note.',
        },
      },
    },
  },
  {
    name: 'split_expense',
    description:
      'Split a bill with friends: records your share, deducts the total paid from your balance, and creates debt records for friends.',
    inputSchema: {
      type: 'object',
      properties: {
        totalAmount: {
          type: 'number',
          description: 'Total bill amount paid.',
        },
        description: {
          type: 'string',
          description: 'Description of what was split (e.g. "Dinner at Olive Garden").',
        },
        friendEmails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of friends splitting the bill.',
        },
        paymentMethod: {
          type: 'string',
          enum: ['online', 'cash'],
          description: 'Payment method used to pay the total bill (default: online).',
          default: 'online',
        },
        category: {
          type: 'string',
          description: 'Category for the expense (default: Food & Dining).',
          default: 'Food & Dining',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (default: today).',
        },
      },
      required: ['totalAmount', 'description', 'friendEmails'],
    },
  },
  {
    name: 'get_debts',
    description:
      'View active bill split debts: see who owes you money ("Owed to You") and who you owe money to ("You Owe").',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'you_owe', 'owed_to_you'],
          description: 'Filter debts: all, you_owe, or owed_to_you (default: all).',
          default: 'all',
        },
      },
    },
  },
  {
    name: 'settle_debt',
    description:
      'Mark a debt as paid (debtor) or confirm receipt of settlement payment (creditor).',
    inputSchema: {
      type: 'object',
      properties: {
        debtId: {
          type: 'string',
          description: 'The unique ID of the debt to settle.',
        },
        action: {
          type: 'string',
          enum: ['mark_paid', 'confirm_receipt'],
          description:
            'mark_paid: Debtor indicates they sent payment; confirm_receipt: Creditor confirms payment received.',
        },
      },
      required: ['debtId', 'action'],
    },
  },
];

// Helper: Tool Handlers
async function handleAddTransaction(db, userId, args) {
  const amount = Number(args.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount: must be a positive number.');
  }

  const type = args.type === 'income' ? 'income' : 'expense';
  const category = (args.category || 'Other').trim();
  const paymentMethod = args.paymentMethod === 'cash' ? 'cash' : 'online';
  const description = (args.description || '').trim();
  const date = args.date || new Date().toISOString().split('T')[0];
  const affectCurrentBalance = args.affectCurrentBalance !== false;

  const transactionData = {
    userId,
    amount,
    type,
    category,
    paymentMethod,
    description,
    date,
    affectCurrentBalance,
    totalPaid: amount,
    createdAt: new Date(),
    source: 'mcp_assistant',
  };

  const docRef = await db.collection('transactions').add(transactionData);

  // Apply balance adjustment if requested
  let updatedBalances = null;
  if (affectCurrentBalance) {
    const balanceRef = db.collection('currentBalances').doc(userId);
    const balanceSnap = await balanceRef.get();
    const current = balanceSnap.exists ? balanceSnap.data() : { online: 0, cash: 0 };

    const delta = type === 'income' ? amount : -amount;
    const nextBalances = {
      online: paymentMethod === 'online' ? (Number(current.online) || 0) + delta : Number(current.online) || 0,
      cash: paymentMethod === 'cash' ? (Number(current.cash) || 0) + delta : Number(current.cash) || 0,
      lastUpdated: new Date(),
      updatedBy: 'mcp_assistant',
    };

    await balanceRef.set(nextBalances, { merge: true });
    updatedBalances = nextBalances;
  }

  return {
    success: true,
    transactionId: docRef.id,
    type,
    amount,
    category,
    paymentMethod,
    description: description || category,
    date,
    updatedBalances,
    message: `Successfully logged ${type} of ${amount} for "${description || category}".`,
  };
}

async function handleGetSummary(db, userId) {
  // Current balances
  const balanceDoc = await db.collection('currentBalances').doc(userId).get();
  const balances = balanceDoc.exists
    ? balanceDoc.data()
    : { online: 0, cash: 0 };

  // Current month budget
  const budgetDoc = await db.collection('budgets').doc(userId).get();
  const budget = budgetDoc.exists ? budgetDoc.data() : null;

  // Calculate current month spending
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const transactionsSnap = await db
    .collection('transactions')
    .where('userId', '==', userId)
    .where('date', '>=', firstDayOfMonth)
    .get();

  let monthExpenses = 0;
  let monthIncome = 0;
  const categorySpend = {};

  transactionsSnap.forEach((doc) => {
    const d = doc.data();
    const amt = Number(d.amount) || 0;
    if (d.type === 'expense') {
      monthExpenses += amt;
      const cat = d.category || 'Other';
      categorySpend[cat] = (categorySpend[cat] || 0) + amt;
    } else if (d.type === 'income') {
      monthIncome += amt;
    }
  });

  const totalBalance = (Number(balances.online) || 0) + (Number(balances.cash) || 0);

  return {
    balances: {
      online: Number(balances.online) || 0,
      cash: Number(balances.cash) || 0,
      total: totalBalance,
    },
    currentMonth: {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSpent: monthExpenses,
      totalIncome: monthIncome,
      budgetLimit: budget?.monthlyLimit ? Number(budget.monthlyLimit) : null,
      budgetRemaining: budget?.monthlyLimit
        ? Number(budget.monthlyLimit) - monthExpenses
        : null,
      topCategories: Object.entries(categorySpend)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount })),
    },
  };
}

async function handleListTransactions(db, userId, args) {
  const limit = Math.min(Number(args.limit) || 10, 50);
  let query = db
    .collection('transactions')
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .limit(limit * 2); // fetch extra for in-memory filtering

  let snapshot;
  try {
    snapshot = await query.get();
  } catch {
    // If index is missing, query without orderBy and sort in memory
    const fallbackSnap = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .get();
    snapshot = fallbackSnap;
  }

  let items = [];
  snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));

  // In-memory sort by date descending
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Filters
  if (args.type) {
    items = items.filter((t) => t.type === args.type);
  }
  if (args.category) {
    const catLower = args.category.toLowerCase();
    items = items.filter((t) => (t.category || '').toLowerCase().includes(catLower));
  }
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    items = items.filter(
      (t) =>
        (t.description || '').toLowerCase().includes(searchLower) ||
        (t.category || '').toLowerCase().includes(searchLower)
    );
  }

  return {
    count: Math.min(items.length, limit),
    transactions: items.slice(0, limit).map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      paymentMethod: t.paymentMethod,
      description: t.description || '',
      isSplit: Boolean(t.isSplit),
    })),
  };
}

async function handleSplitExpense(db, userId, args) {
  const totalAmount = Number(args.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('totalAmount must be a positive number.');
  }

  const friendEmails = Array.isArray(args.friendEmails)
    ? args.friendEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  if (friendEmails.length === 0) {
    throw new Error('friendEmails must contain at least one friend email address.');
  }

  const description = (args.description || 'Split Bill').trim();
  const paymentMethod = args.paymentMethod === 'cash' ? 'cash' : 'online';
  const category = (args.category || 'Food & Dining').trim();
  const date = args.date || new Date().toISOString().split('T')[0];

  const totalPeople = friendEmails.length + 1;
  const perPersonShare = Math.round((totalAmount / totalPeople) * 100) / 100;

  // 1. Add user's split transaction (their share)
  const txData = {
    userId,
    amount: perPersonShare,
    totalPaid: totalAmount,
    type: 'expense',
    category,
    paymentMethod,
    description: `${description} (Split with ${friendEmails.join(', ')})`,
    date,
    isSplit: true,
    splitWith: friendEmails,
    createdAt: new Date(),
    source: 'mcp_assistant',
  };

  const txRef = await db.collection('transactions').add(txData);

  // 2. Adjust user's balance by total paid
  const balanceRef = db.collection('currentBalances').doc(userId);
  const balanceSnap = await balanceRef.get();
  const current = balanceSnap.exists ? balanceSnap.data() : { online: 0, cash: 0 };
  const nextBalances = {
    online: paymentMethod === 'online' ? (Number(current.online) || 0) - totalAmount : Number(current.online) || 0,
    cash: paymentMethod === 'cash' ? (Number(current.cash) || 0) - totalAmount : Number(current.cash) || 0,
    lastUpdated: new Date(),
    updatedBy: 'mcp_assistant',
  };
  await balanceRef.set(nextBalances, { merge: true });

  // 3. Register debt for each friend
  const createdDebts = [];
  for (const email of friendEmails) {
    // Attempt to lookup friend's user document
    let debtorId = email;
    const userLookup = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userLookup.empty) {
      debtorId = userLookup.docs[0].id;
    }

    const debtDoc = {
      creditorId: userId,
      debtorId,
      debtorEmail: email,
      amount: perPersonShare,
      description: `${description} (${date})`,
      status: 'unpaid',
      transactionId: txRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const debtRef = await db.collection('debts').add(debtDoc);
    createdDebts.push({ debtId: debtRef.id, debtor: email, share: perPersonShare });
  }

  return {
    success: true,
    totalBill: totalAmount,
    yourShare: perPersonShare,
    splitBetween: totalPeople,
    debtsCreated: createdDebts,
    message: `Split ${totalAmount} among ${totalPeople} people (${perPersonShare} each). Wallet deducted: ${totalAmount}.`,
  };
}

async function handleGetDebts(db, userId, args) {
  const filter = args.filter || 'all';
  const debts = [];

  // Owed to you (creditorId == userId)
  if (filter === 'all' || filter === 'owed_to_you') {
    const owedToYouSnap = await db
      .collection('debts')
      .where('creditorId', '==', userId)
      .get();

    owedToYouSnap.forEach((d) => {
      debts.push({
        id: d.id,
        direction: 'owed_to_you',
        amount: d.data().amount,
        description: d.data().description,
        debtor: d.data().debtorEmail || d.data().debtorId,
        status: d.data().status,
        createdAt: d.data().createdAt,
      });
    });
  }

  // You owe (debtorId == userId)
  if (filter === 'all' || filter === 'you_owe') {
    const youOweSnap = await db
      .collection('debts')
      .where('debtorId', '==', userId)
      .get();

    youOweSnap.forEach((d) => {
      debts.push({
        id: d.id,
        direction: 'you_owe',
        amount: d.data().amount,
        description: d.data().description,
        creditor: d.data().creditorId,
        status: d.data().status,
        createdAt: d.data().createdAt,
      });
    });
  }

  const totalOwedToYou = debts
    .filter((d) => d.direction === 'owed_to_you' && d.status !== 'paid')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const totalYouOwe = debts
    .filter((d) => d.direction === 'you_owe' && d.status !== 'paid')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return {
    totalOwedToYou,
    totalYouOwe,
    netBalance: totalOwedToYou - totalYouOwe,
    debts,
  };
}

async function handleSettleDebt(db, userId, args) {
  const { debtId, action } = args;
  if (!debtId || !action) {
    throw new Error('debtId and action are required.');
  }

  const debtRef = db.collection('debts').doc(debtId);
  const debtSnap = await debtRef.get();
  if (!debtSnap.exists) {
    throw new Error(`Debt with ID ${debtId} not found.`);
  }

  const debt = debtSnap.data();

  if (action === 'mark_paid') {
    // Only the debtor can mark it paid
    if (debt.debtorId !== userId && debt.debtorEmail !== userId) {
      throw new Error('Only the person who owes the debt can mark it as paid.');
    }
    await debtRef.update({
      status: 'pending_confirmation',
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      status: 'pending_confirmation',
      message: `Debt of ${debt.amount} for "${debt.description}" marked as paid. Waiting for creditor to confirm receipt.`,
    };
  }

  if (action === 'confirm_receipt') {
    // Only the creditor can confirm receipt
    if (debt.creditorId !== userId) {
      throw new Error('Only the creditor can confirm receipt of this debt payment.');
    }
    await debtRef.update({
      status: 'paid',
      settledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      status: 'paid',
      message: `Receipt confirmed. Debt of ${debt.amount} for "${debt.description}" is now fully settled!`,
    };
  }

  throw new Error(`Invalid action: ${action}. Expected "mark_paid" or "confirm_receipt".`);
}

// Main Vercel Serverless Function Handler
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // GET: Health check & MCP Server capability discovery
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      protocol: 'Model Context Protocol (MCP) JSON-RPC 2.0',
      server: SERVER_INFO,
      toolsCount: TOOLS.length,
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
      documentation: 'Send POST requests with "Authorization: Bearer <spw_live_...>" header.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rpc = req.body || {};
  const { id = 1, method, params = {} } = rpc;

  // 1. Unauthenticated MCP handshakes: initialize & ping
  if (method === 'initialize') {
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: SERVER_INFO,
      },
    });
  }

  if (method === 'notifications/initialized') {
    return res.status(200).json({ jsonrpc: '2.0', id });
  }

  if (method === 'ping') {
    return res.status(200).json({ jsonrpc: '2.0', id, result: {} });
  }

  // 2. Authenticate with SpendWise API Key
  let authContext = null;
  try {
    authContext = await authenticateApiKey(req);
  } catch (authErr) {
    console.error('Auth error in MCP handler:', authErr);
    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Server error verifying API Key.',
        data: authErr.message,
      },
    });
  }

  if (!authContext) {
    return res.status(401).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32001,
        message:
          'Unauthorized. Please provide a valid SpendWise API Key via "Authorization: Bearer spw_live_..." header or "?apiKey=" query parameter.',
      },
    });
  }

  const { userId } = authContext;
  const db = getAdminDb();

  // 3. Handle tools/list
  if (method === 'tools/list') {
    return res.status(200).json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    });
  }

  // 4. Handle tools/call
  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;

    try {
      let resultData = null;

      switch (name) {
        case 'add_transaction':
          resultData = await handleAddTransaction(db, userId, args);
          break;
        case 'get_summary':
          resultData = await handleGetSummary(db, userId);
          break;
        case 'list_transactions':
          resultData = await handleListTransactions(db, userId, args);
          break;
        case 'split_expense':
          resultData = await handleSplitExpense(db, userId, args);
          break;
        case 'get_debts':
          resultData = await handleGetDebts(db, userId, args);
          break;
        case 'settle_debt':
          resultData = await handleSettleDebt(db, userId, args);
          break;
        default:
          return res.status(200).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`,
            },
          });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text:
                typeof resultData === 'string'
                  ? resultData
                  : JSON.stringify(resultData, null, 2),
            },
          ],
        },
      });
    } catch (toolErr) {
      console.error(`Error executing tool ${name}:`, toolErr);
      return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${toolErr.message}`,
            },
          ],
        },
      });
    }
  }

  return res.status(400).json({
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Unsupported method: ${method}`,
    },
  });
}
