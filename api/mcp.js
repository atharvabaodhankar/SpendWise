import { authenticateApiKey } from './_utils/authApiKey.js';
import { getAdminDb } from './_utils/firebaseAdmin.js';

const SERVER_INFO = {
  name: 'spendwise-mcp',
  version: '2.0.0',
};

// Complete catalog of all 26 SpendWise MCP Tools
const TOOLS = [
  // --- TRANSACTIONS ---
  {
    name: 'add_transaction',
    description:
      'Log an expense or income transaction in SpendWise. Automatically adjusts online or cash balance and updates budget tracking.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The amount of the transaction (e.g. 450 or 12.50). Must be positive.',
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
    name: 'list_transactions',
    description:
      'Query transactions from SpendWise with optional category, type, date range, and keyword search filters.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to return (default: 15, max: 100).',
          default: 15,
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
        startDate: {
          type: 'string',
          description: 'Start date filter in YYYY-MM-DD format.',
        },
        endDate: {
          type: 'string',
          description: 'End date filter in YYYY-MM-DD format.',
        },
        search: {
          type: 'string',
          description: 'Filter by text in description or category.',
        },
      },
    },
  },
  {
    name: 'get_transaction',
    description: 'Retrieve full details of a specific transaction by its unique ID.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The unique ID of the transaction to fetch.',
        },
      },
      required: ['transactionId'],
    },
  },
  {
    name: 'update_transaction',
    description:
      'Update fields of an existing transaction (amount, category, description, date, paymentMethod, type). Automatically reconciles wallet balances.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The unique ID of the transaction to update.',
        },
        amount: {
          type: 'number',
          description: 'New amount of the transaction.',
        },
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'New transaction type: expense or income.',
        },
        category: {
          type: 'string',
          description: 'New category name.',
        },
        description: {
          type: 'string',
          description: 'New description or note.',
        },
        date: {
          type: 'string',
          description: 'New date in YYYY-MM-DD format.',
        },
        paymentMethod: {
          type: 'string',
          enum: ['online', 'cash'],
          description: 'New payment method: online or cash.',
        },
      },
      required: ['transactionId'],
    },
  },
  {
    name: 'delete_transaction',
    description:
      'Delete a transaction by ID. If the transaction affected the wallet balance, the balance will be safely reversed/restored.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'The unique ID of the transaction to delete.',
        },
      },
      required: ['transactionId'],
    },
  },

  // --- BALANCES & SUMMARY ---
  {
    name: 'get_summary',
    description:
      'Get comprehensive financial overview for the user: current online & cash balances, monthly budget progress, current month total spend/income, and top categories.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_balances',
    description:
      'Set or adjust current Online (digital/bank) and Cash balances in SpendWise.',
    inputSchema: {
      type: 'object',
      properties: {
        online: {
          type: 'number',
          description: 'Online balance amount to set or delta to adjust.',
        },
        cash: {
          type: 'number',
          description: 'Cash balance amount to set or delta to adjust.',
        },
        mode: {
          type: 'string',
          enum: ['set', 'adjust'],
          description: '"set" to override balance to specified amount; "adjust" to add/subtract delta. Defaults to "set".',
          default: 'set',
        },
      },
    },
  },

  // --- BUDGETS ---
  {
    name: 'get_budget',
    description:
      'Fetch current monthly budget limit, spending progress so far this month, remaining allowance, and budget health status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_budget',
    description:
      'Set or update the monthly spending budget limit in SpendWise.',
    inputSchema: {
      type: 'object',
      properties: {
        monthlyLimit: {
          type: 'number',
          description: 'The monthly budget spending limit (e.g. 30000). Must be positive.',
        },
      },
      required: ['monthlyLimit'],
    },
  },

  // --- RECURRING TRANSACTIONS ---
  {
    name: 'list_recurring_transactions',
    description:
      'List all recurring subscriptions, bills, rent, and scheduled expenses or incomes.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'Filter by expense or income recurring items.',
        },
      },
    },
  },
  {
    name: 'add_recurring_transaction',
    description:
      'Schedule a recurring transaction (e.g. Netflix subscription, monthly rent, gym membership, or salary).',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount for each recurring occurrence.',
        },
        category: {
          type: 'string',
          description: 'Category (e.g. Bills, Subscription, Rent, Salary).',
        },
        description: {
          type: 'string',
          description: 'Name or description of recurring item (e.g. "Spotify Premium").',
        },
        frequency: {
          type: 'string',
          enum: ['weekly', 'monthly', 'yearly'],
          description: 'Frequency of recurrence (weekly, monthly, or yearly). Defaults to monthly.',
          default: 'monthly',
        },
        type: {
          type: 'string',
          enum: ['expense', 'income'],
          description: 'Type: expense or income. Defaults to expense.',
          default: 'expense',
        },
        paymentMethod: {
          type: 'string',
          enum: ['online', 'cash'],
          description: 'Wallet to pay from: online or cash. Defaults to online.',
          default: 'online',
        },
      },
      required: ['amount', 'category', 'description'],
    },
  },
  {
    name: 'delete_recurring_transaction',
    description: 'Delete a recurring scheduled transaction by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        recurringId: {
          type: 'string',
          description: 'The unique ID of the recurring transaction to delete.',
        },
      },
      required: ['recurringId'],
    },
  },

  // --- SOCIAL BILL SPLITTING & DEBTS ---
  {
    name: 'split_expense',
    description:
      'Split a bill with friends: records your equal share, deducts total paid from your wallet, and creates debt records for each friend.',
    inputSchema: {
      type: 'object',
      properties: {
        totalAmount: {
          type: 'number',
          description: 'Total bill amount paid by you.',
        },
        description: {
          type: 'string',
          description: 'Description of what was split (e.g. "Dinner at Burma Burma").',
        },
        friendEmails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of friends splitting the bill with you.',
        },
        paymentMethod: {
          type: 'string',
          enum: ['online', 'cash'],
          description: 'Payment wallet used to pay total bill (default: online).',
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
      'View bill split debts: see who owes you money ("Owed to You"), who you owe money to ("You Owe"), and net balance.',
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
      'Mark a debt as paid (debtor action) or confirm receipt of settlement payment (creditor action).',
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
            'mark_paid: Debtor indicates payment was sent; confirm_receipt: Creditor confirms payment was received.',
        },
      },
      required: ['debtId', 'action'],
    },
  },

  // --- FRIENDS ---
  {
    name: 'list_friends',
    description: "List the authenticated user's connected friends and their profiles.",
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_friend',
    description: 'Add a friend by their email address to split bills with in SpendWise.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: "Friend's registered email address.",
        },
        displayName: {
          type: 'string',
          description: "Optional nickname or display name for the friend.",
        },
      },
      required: ['email'],
    },
  },

  // --- INVESTMENTS & PORTFOLIO ---
  {
    name: 'list_investments',
    description:
      'List all investment holdings (Gold, Silver, Mutual Funds, Fixed Deposits, Stocks, Crypto, Other) with purchase amount, current value, and profit/loss.',
    inputSchema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          enum: ['gold', 'silver', 'mutual_fund', 'fd', 'stocks', 'crypto', 'other'],
          description: 'Optional filter by asset type.',
        },
      },
    },
  },
  {
    name: 'add_investment',
    description:
      'Log an investment holding in SpendWise (e.g. Mutual fund SIP, Digital Gold, Stock purchase, Fixed Deposit).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the investment (e.g. "Parag Parikh Flexi Cap", "24K Digital Gold", "HDFC 1-Yr FD").',
        },
        assetType: {
          type: 'string',
          enum: ['gold', 'silver', 'mutual_fund', 'fd', 'stocks', 'crypto', 'other'],
          description: 'Asset category.',
        },
        investedAmount: {
          type: 'number',
          description: 'Total amount invested.',
        },
        currentValue: {
          type: 'number',
          description: 'Current market value of the holding (defaults to investedAmount).',
        },
        provider: {
          type: 'string',
          description: 'Broker, platform or bank (e.g. Zerodha, Groww, PhonePe, SBI, Coin).',
          default: 'Direct',
        },
        purchaseDate: {
          type: 'string',
          description: 'Purchase date in YYYY-MM-DD format (defaults to today).',
        },
        maturityDate: {
          type: 'string',
          description: 'Maturity date in YYYY-MM-DD format (for FDs or bonds).',
        },
        interestRate: {
          type: 'number',
          description: 'Annual interest rate percentage (e.g. 7.1 for FD).',
        },
        units: {
          type: 'number',
          description: 'Number of units, shares, or grams owned.',
        },
        notes: {
          type: 'string',
          description: 'Optional notes or folio number.',
        },
      },
      required: ['name', 'assetType', 'investedAmount'],
    },
  },
  {
    name: 'update_investment',
    description:
      'Update the current valuation, units, or details of an existing investment holding.',
    inputSchema: {
      type: 'object',
      properties: {
        investmentId: {
          type: 'string',
          description: 'Unique ID of the investment record to update.',
        },
        currentValue: {
          type: 'number',
          description: 'Updated current market value.',
        },
        investedAmount: {
          type: 'number',
          description: 'Updated invested principal amount.',
        },
        units: {
          type: 'number',
          description: 'Updated units or quantity.',
        },
        notes: {
          type: 'string',
          description: 'Updated notes.',
        },
      },
      required: ['investmentId'],
    },
  },
  {
    name: 'delete_investment',
    description: 'Delete an investment holding record by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        investmentId: {
          type: 'string',
          description: 'The unique ID of the investment holding to delete.',
        },
      },
      required: ['investmentId'],
    },
  },
  {
    name: 'get_portfolio_summary',
    description:
      'Calculate complete investment portfolio summary: total invested, total current value, overall profit/loss, ROI %, and asset allocation breakdown.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // --- SALARY TRACKING ---
  {
    name: 'list_salaries',
    description: 'List recorded salary payments and pay slips.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum salary records to return (default: 12).',
          default: 12,
        },
      },
    },
  },
  {
    name: 'add_salary',
    description: 'Log a monthly salary or compensation credit in SpendWise.',
    inputSchema: {
      type: 'object',
      properties: {
        salaryMonth: {
          type: 'string',
          description: 'Salary period (e.g. "July 2026" or "Jul 2026").',
        },
        amount: {
          type: 'number',
          description: 'Net salary amount received.',
        },
        receivedDate: {
          type: 'string',
          description: 'Date salary was credited in YYYY-MM-DD format (defaults to today).',
        },
        companyOrSource: {
          type: 'string',
          description: 'Employer, client or income source (e.g. "Acme Corp").',
        },
        status: {
          type: 'string',
          enum: ['received', 'pending'],
          description: 'Status: "received" or "pending". Defaults to "received".',
          default: 'received',
        },
        notes: {
          type: 'string',
          description: 'Optional notes (e.g. "Includes quarterly bonus").',
        },
      },
      required: ['salaryMonth', 'amount'],
    },
  },
  {
    name: 'delete_salary',
    description: 'Delete a salary record by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        salaryId: {
          type: 'string',
          description: 'The unique ID of the salary record to delete.',
        },
      },
      required: ['salaryId'],
    },
  },

  // --- ANALYTICS & REPORTS ---
  {
    name: 'get_analytics',
    description:
      'Generate deep financial analytics: category-wise spend percentages, cash vs online payment method ratio, 6-month spending trends, daily average spend, and peak spending days.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: 'Target month in YYYY-MM format (e.g. "2026-07") or "all". Defaults to current month.',
        },
      },
    },
  },
];

// ==========================================
// TOOL IMPLEMENTATION HANDLERS
// ==========================================

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
    message: `Successfully logged ${type} of ₹${amount.toFixed(2)} for "${description || category}" (${paymentMethod} wallet).`,
  };
}

async function handleListTransactions(db, userId, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 100);
  let snapshot;
  try {
    const query = db
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(limit * 3);
    snapshot = await query.get();
  } catch {
    // Fallback if index on userId+date is building or missing
    snapshot = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .get();
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
  if (args.startDate) {
    items = items.filter((t) => t.date >= args.startDate);
  }
  if (args.endDate) {
    items = items.filter((t) => t.date <= args.endDate);
  }
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    items = items.filter(
      (t) =>
        (t.description || '').toLowerCase().includes(searchLower) ||
        (t.category || '').toLowerCase().includes(searchLower)
    );
  }

  const resultItems = items.slice(0, limit).map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    amount: Number(t.amount) || 0,
    category: t.category,
    paymentMethod: t.paymentMethod,
    description: t.description || '',
    isSplit: Boolean(t.isSplit),
  }));

  return {
    totalMatches: items.length,
    returnedCount: resultItems.length,
    transactions: resultItems,
  };
}

async function handleGetTransaction(db, userId, args) {
  const { transactionId } = args;
  if (!transactionId) throw new Error('transactionId is required.');

  const docSnap = await db.collection('transactions').doc(transactionId).get();
  if (!docSnap.exists) throw new Error(`Transaction ${transactionId} not found.`);

  const data = docSnap.data();
  if (data.userId !== userId) throw new Error('Unauthorized: You do not own this transaction.');

  return {
    id: docSnap.id,
    ...data,
  };
}

async function handleUpdateTransaction(db, userId, args) {
  const { transactionId } = args;
  if (!transactionId) throw new Error('transactionId is required.');

  const txRef = db.collection('transactions').doc(transactionId);
  const snap = await txRef.get();
  if (!snap.exists) throw new Error(`Transaction ${transactionId} not found.`);

  const old = snap.data();
  if (old.userId !== userId) throw new Error('Unauthorized: You do not own this transaction.');

  const updates = {};
  if (args.category !== undefined) updates.category = String(args.category).trim();
  if (args.description !== undefined) updates.description = String(args.description).trim();
  if (args.date !== undefined) updates.date = String(args.date);

  const newAmount = args.amount !== undefined ? Number(args.amount) : old.amount;
  const newType = args.type !== undefined ? args.type : old.type;
  const newPaymentMethod = args.paymentMethod !== undefined ? args.paymentMethod : old.paymentMethod;

  if (args.amount !== undefined) updates.amount = newAmount;
  if (args.type !== undefined) updates.type = newType;
  if (args.paymentMethod !== undefined) updates.paymentMethod = newPaymentMethod;
  updates.updatedAt = new Date();

  // Reconcile balances if this transaction affected balances
  let updatedBalances = null;
  if (old.affectCurrentBalance !== false) {
    const balanceRef = db.collection('currentBalances').doc(userId);
    const balanceSnap = await balanceRef.get();
    const current = balanceSnap.exists ? balanceSnap.data() : { online: 0, cash: 0 };

    let online = Number(current.online) || 0;
    let cash = Number(current.cash) || 0;

    // 1. Revert old effect
    const oldAmt = Number(old.amount) || 0;
    if (old.paymentMethod === 'cash') {
      cash += old.type === 'expense' ? oldAmt : -oldAmt;
    } else {
      online += old.type === 'expense' ? oldAmt : -oldAmt;
    }

    // 2. Apply new effect
    if (newPaymentMethod === 'cash') {
      cash += newType === 'expense' ? -newAmount : newAmount;
    } else {
      online += newType === 'expense' ? -newAmount : newAmount;
    }

    const nextBalances = {
      online,
      cash,
      lastUpdated: new Date(),
      updatedBy: 'mcp_assistant_update',
    };
    await balanceRef.set(nextBalances, { merge: true });
    updatedBalances = nextBalances;
  }

  await txRef.update(updates);

  return {
    success: true,
    transactionId,
    updatedFields: updates,
    updatedBalances,
    message: `Transaction ${transactionId} updated successfully.`,
  };
}

async function handleDeleteTransaction(db, userId, args) {
  const { transactionId } = args;
  if (!transactionId) throw new Error('transactionId is required.');

  const txRef = db.collection('transactions').doc(transactionId);
  const snap = await txRef.get();
  if (!snap.exists) throw new Error(`Transaction ${transactionId} not found.`);

  const old = snap.data();
  if (old.userId !== userId) throw new Error('Unauthorized: You do not own this transaction.');

  // Revert balance effect if transaction affected balance
  let restoredBalances = null;
  if (old.affectCurrentBalance !== false) {
    const balanceRef = db.collection('currentBalances').doc(userId);
    const balanceSnap = await balanceRef.get();
    if (balanceSnap.exists) {
      const current = balanceSnap.data();
      const amt = Number(old.amount) || 0;
      const pm = old.paymentMethod === 'cash' ? 'cash' : 'online';

      // Reversal: If expense, refund back; if income, subtract
      const reversalDelta = old.type === 'expense' ? amt : -amt;
      const nextBalances = {
        ...current,
        [pm]: (Number(current[pm]) || 0) + reversalDelta,
        lastUpdated: new Date(),
        updatedBy: 'mcp_assistant_delete',
      };
      await balanceRef.set(nextBalances, { merge: true });
      restoredBalances = nextBalances;
    }
  }

  await txRef.delete();

  return {
    success: true,
    deletedId: transactionId,
    restoredBalances,
    message: `Transaction of ₹${old.amount} for "${old.description || old.category}" has been deleted.`,
  };
}

async function handleGetSummary(db, userId) {
  // Balances
  const balanceDoc = await db.collection('currentBalances').doc(userId).get();
  const balances = balanceDoc.exists ? balanceDoc.data() : { online: 0, cash: 0 };

  // Budget
  const budgetDoc = await db.collection('budgets').doc(userId).get();
  const budget = budgetDoc.exists ? budgetDoc.data() : null;

  // Month-to-date calculation
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
  const budgetLimit = budget?.monthlyLimit ? Number(budget.monthlyLimit) : null;
  const budgetRemaining = budgetLimit ? budgetLimit - monthExpenses : null;
  const budgetUtilization = budgetLimit ? Math.round((monthExpenses / budgetLimit) * 100) : null;

  return {
    balances: {
      online: Number(balances.online) || 0,
      cash: Number(balances.cash) || 0,
      total: totalBalance,
      currency: 'INR (₹)',
    },
    currentMonth: {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSpent: monthExpenses,
      totalIncome: monthIncome,
      netSavings: monthIncome - monthExpenses,
      budgetLimit,
      budgetRemaining,
      budgetUtilizationPercent: budgetUtilization,
      isOverBudget: budgetRemaining !== null ? budgetRemaining < 0 : false,
      topCategories: Object.entries(categorySpend)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          shareOfExpenses: monthExpenses > 0 ? `${Math.round((amount / monthExpenses) * 100)}%` : '0%',
        })),
    },
  };
}

async function handleUpdateBalances(db, userId, args) {
  const mode = args.mode || 'set';
  const balanceRef = db.collection('currentBalances').doc(userId);
  const snap = await balanceRef.get();
  const current = snap.exists ? snap.data() : { online: 0, cash: 0 };

  let nextOnline = Number(current.online) || 0;
  let nextCash = Number(current.cash) || 0;

  if (mode === 'adjust') {
    if (args.online !== undefined) nextOnline += Number(args.online);
    if (args.cash !== undefined) nextCash += Number(args.cash);
  } else {
    if (args.online !== undefined) nextOnline = Number(args.online);
    if (args.cash !== undefined) nextCash = Number(args.cash);
  }

  const nextBalances = {
    online: nextOnline,
    cash: nextCash,
    lastUpdated: new Date(),
    updatedBy: 'mcp_assistant',
  };

  await balanceRef.set(nextBalances, { merge: true });

  return {
    success: true,
    mode,
    balances: {
      online: nextOnline,
      cash: nextCash,
      total: nextOnline + nextCash,
    },
    message: `Balances updated: Online: ₹${nextOnline.toFixed(2)}, Cash: ₹${nextCash.toFixed(2)}, Total: ₹${(nextOnline + nextCash).toFixed(2)}.`,
  };
}

async function handleGetBudget(db, userId) {
  const budgetDoc = await db.collection('budgets').doc(userId).get();
  const budget = budgetDoc.exists ? budgetDoc.data() : null;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const transactionsSnap = await db
    .collection('transactions')
    .where('userId', '==', userId)
    .where('date', '>=', firstDayOfMonth)
    .get();

  let spent = 0;
  transactionsSnap.forEach((d) => {
    if (d.data().type === 'expense') spent += Number(d.data().amount) || 0;
  });

  const limit = budget?.monthlyLimit ? Number(budget.monthlyLimit) : null;
  const remaining = limit !== null ? limit - spent : null;
  const percent = limit ? Math.round((spent / limit) * 100) : null;

  return {
    month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
    monthlyLimit: limit,
    totalSpent: spent,
    remainingAllowance: remaining,
    utilizationPercent: percent,
    status: limit === null ? 'no_budget_set' : spent > limit ? 'exceeded' : percent > 90 ? 'critical' : 'on_track',
    updatedAt: budget?.updatedAt || null,
  };
}

async function handleSetBudget(db, userId, args) {
  const monthlyLimit = Number(args.monthlyLimit);
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
    throw new Error('monthlyLimit must be a positive number.');
  }

  const payload = {
    monthlyLimit,
    userId,
    updatedAt: new Date(),
    updatedBy: 'mcp_assistant',
  };

  await db.collection('budgets').doc(userId).set(payload, { merge: true });

  return {
    success: true,
    monthlyLimit,
    message: `Monthly budget limit set to ₹${monthlyLimit.toFixed(2)}.`,
  };
}

async function handleListRecurring(db, userId, args) {
  let query = db.collection('recurringTransactions').where('userId', '==', userId);
  const snap = await query.get();

  let items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

  if (args.type) {
    items = items.filter((i) => i.type === args.type);
  }

  return {
    count: items.length,
    recurringTransactions: items.map((i) => ({
      id: i.id,
      description: i.description,
      amount: Number(i.amount) || 0,
      category: i.category,
      frequency: i.frequency,
      type: i.type || 'expense',
      paymentMethod: i.paymentMethod || 'online',
      nextExecution: i.nextExecution || null,
      lastExecuted: i.lastExecuted || null,
    })),
  };
}

function computeNextExecution(frequency) {
  const d = new Date();
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

async function handleAddRecurring(db, userId, args) {
  const amount = Number(args.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount must be a positive number.');
  }

  const frequency = ['weekly', 'monthly', 'yearly'].includes(args.frequency)
    ? args.frequency
    : 'monthly';
  const type = args.type === 'income' ? 'income' : 'expense';
  const paymentMethod = args.paymentMethod === 'cash' ? 'cash' : 'online';
  const category = (args.category || 'Bills').trim();
  const description = (args.description || '').trim();

  const payload = {
    userId,
    amount,
    category,
    description,
    frequency,
    type,
    paymentMethod,
    nextExecution: computeNextExecution(frequency),
    lastExecuted: null,
    createdAt: new Date(),
    source: 'mcp_assistant',
  };

  const docRef = await db.collection('recurringTransactions').add(payload);

  return {
    success: true,
    recurringId: docRef.id,
    ...payload,
    message: `Scheduled ${frequency} recurring ${type} of ₹${amount.toFixed(2)} for "${description}".`,
  };
}

async function handleDeleteRecurring(db, userId, args) {
  const { recurringId } = args;
  if (!recurringId) throw new Error('recurringId is required.');

  const ref = db.collection('recurringTransactions').doc(recurringId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Recurring transaction ${recurringId} not found.`);
  if (snap.data().userId !== userId) throw new Error('Unauthorized.');

  await ref.delete();

  return {
    success: true,
    deletedId: recurringId,
    message: `Recurring scheduled transaction ${recurringId} deleted.`,
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

  // 1. Add user's split transaction (their personal share)
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
    message: `Split ₹${totalAmount.toFixed(2)} among ${totalPeople} people (₹${perPersonShare.toFixed(2)} each). Wallet deducted: ₹${totalAmount.toFixed(2)}.`,
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
        amount: Number(d.data().amount) || 0,
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
        amount: Number(d.data().amount) || 0,
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
      message: `Debt of ₹${debt.amount} for "${debt.description}" marked as paid. Waiting for creditor to confirm receipt.`,
    };
  }

  if (action === 'confirm_receipt') {
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
      message: `Receipt confirmed. Debt of ₹${debt.amount} for "${debt.description}" is now fully settled!`,
    };
  }

  throw new Error(`Invalid action: ${action}. Expected "mark_paid" or "confirm_receipt".`);
}

async function handleListFriends(db, userId) {
  const friendsSnap = await db
    .collection('users')
    .doc(userId)
    .collection('friends')
    .get();

  const friends = [];
  for (const doc of friendsSnap.docs) {
    const data = doc.data();
    let displayName = data.displayName || data.email;
    try {
      const userSnap = await db.collection('users').doc(doc.id).get();
      if (userSnap.exists) {
        displayName = userSnap.data().displayName || displayName;
      }
    } catch {}

    friends.push({
      id: doc.id,
      email: data.email,
      displayName,
      createdAt: data.createdAt || null,
    });
  }

  return {
    count: friends.length,
    friends,
  };
}

async function handleAddFriend(db, userId, args) {
  const email = (args.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  let friendUid = email;
  let friendDisplayName = args.displayName || email;

  const lookup = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!lookup.empty) {
    const friendUser = lookup.docs[0];
    friendUid = friendUser.id;
    friendDisplayName = friendUser.data().displayName || friendDisplayName;
  }

  // 1. Add to current user's friends
  await db
    .collection('users')
    .doc(userId)
    .collection('friends')
    .doc(friendUid)
    .set({
      email,
      displayName: friendDisplayName,
      createdAt: new Date(),
    }, { merge: true });

  // 2. Add reciprocal friendship if user doc exists
  if (!lookup.empty) {
    const curUserSnap = await db.collection('users').doc(userId).get();
    const curUserData = curUserSnap.exists ? curUserSnap.data() : {};
    await db
      .collection('users')
      .doc(friendUid)
      .collection('friends')
      .doc(userId)
      .set({
        email: curUserData.email || userId,
        displayName: curUserData.displayName || curUserData.email || 'Friend',
        createdAt: new Date(),
      }, { merge: true });
  }

  return {
    success: true,
    friend: {
      id: friendUid,
      email,
      displayName: friendDisplayName,
    },
    message: `Friend "${friendDisplayName}" (${email}) added successfully.`,
  };
}

async function handleListInvestments(db, userId, args) {
  const snap = await db.collection('investments').where('userId', '==', userId).get();

  let items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

  if (args.assetType) {
    items = items.filter((i) => i.assetType === args.assetType);
  }

  const holdings = items.map((i) => {
    const invested = Number(i.investedAmount) || 0;
    const current = Number(i.currentValue !== undefined ? i.currentValue : invested);
    const pnl = current - invested;
    const returnPct = invested > 0 ? ((pnl / invested) * 100).toFixed(2) + '%' : '0.00%';

    return {
      id: i.id,
      name: i.name,
      assetType: i.assetType,
      provider: i.provider || 'Direct',
      investedAmount: invested,
      currentValue: current,
      profitLoss: pnl,
      returnPercentage: returnPct,
      purchaseDate: i.purchaseDate || null,
      maturityDate: i.maturityDate || null,
      interestRate: i.interestRate || null,
      units: i.units || null,
      notes: i.notes || '',
    };
  });

  return {
    count: holdings.length,
    holdings,
  };
}

async function handleAddInvestment(db, userId, args) {
  const name = (args.name || '').trim();
  if (!name) throw new Error('name is required.');

  const investedAmount = Number(args.investedAmount);
  if (!Number.isFinite(investedAmount) || investedAmount <= 0) {
    throw new Error('investedAmount must be a positive number.');
  }

  const assetType = args.assetType || 'other';
  const currentValue = args.currentValue !== undefined ? Number(args.currentValue) : investedAmount;
  const purchaseDate = args.purchaseDate || new Date().toISOString().split('T')[0];

  const payload = {
    userId,
    name,
    assetType,
    provider: (args.provider || 'Direct').trim(),
    investedAmount,
    currentValue,
    purchaseDate,
    maturityDate: args.maturityDate || null,
    interestRate: args.interestRate ? Number(args.interestRate) : null,
    units: args.units ? Number(args.units) : null,
    notes: (args.notes || '').trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'mcp_assistant',
  };

  const docRef = await db.collection('investments').add(payload);

  return {
    success: true,
    investmentId: docRef.id,
    ...payload,
    message: `Logged ${name} (${assetType}) of ₹${investedAmount.toFixed(2)} on ${payload.provider}.`,
  };
}

async function handleUpdateInvestment(db, userId, args) {
  const { investmentId } = args;
  if (!investmentId) throw new Error('investmentId is required.');

  const ref = db.collection('investments').doc(investmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Investment ${investmentId} not found.`);
  if (snap.data().userId !== userId) throw new Error('Unauthorized.');

  const updates = {};
  if (args.currentValue !== undefined) updates.currentValue = Number(args.currentValue);
  if (args.investedAmount !== undefined) updates.investedAmount = Number(args.investedAmount);
  if (args.units !== undefined) updates.units = Number(args.units);
  if (args.notes !== undefined) updates.notes = String(args.notes).trim();
  updates.updatedAt = new Date();

  await ref.update(updates);

  return {
    success: true,
    investmentId,
    updatedFields: updates,
    message: `Investment holding ${investmentId} updated.`,
  };
}

async function handleDeleteInvestment(db, userId, args) {
  const { investmentId } = args;
  if (!investmentId) throw new Error('investmentId is required.');

  const ref = db.collection('investments').doc(investmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Investment ${investmentId} not found.`);
  if (snap.data().userId !== userId) throw new Error('Unauthorized.');

  await ref.delete();

  return {
    success: true,
    deletedId: investmentId,
    message: `Investment holding ${snap.data().name} deleted.`,
  };
}

async function handleGetPortfolioSummary(db, userId) {
  const snap = await db.collection('investments').where('userId', '==', userId).get();

  let totalInvested = 0;
  let totalCurrentValue = 0;
  const byAssetType = {};

  snap.forEach((d) => {
    const data = d.data();
    const inv = Number(data.investedAmount) || 0;
    const cur = Number(data.currentValue !== undefined ? data.currentValue : inv);
    const type = data.assetType || 'other';

    totalInvested += inv;
    totalCurrentValue += cur;

    if (!byAssetType[type]) {
      byAssetType[type] = { count: 0, invested: 0, current: 0 };
    }
    byAssetType[type].count += 1;
    byAssetType[type].invested += inv;
    byAssetType[type].current += cur;
  });

  const totalPnL = totalCurrentValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) + '%' : '0.00%';

  const assetAllocation = Object.entries(byAssetType).map(([type, stats]) => ({
    assetType: type,
    holdingsCount: stats.count,
    investedAmount: stats.invested,
    currentValue: stats.current,
    profitLoss: stats.current - stats.invested,
    shareOfPortfolio: totalCurrentValue > 0 ? `${Math.round((stats.current / totalCurrentValue) * 100)}%` : '0%',
  }));

  return {
    portfolio: {
      totalHoldings: snap.size,
      totalInvested,
      totalCurrentValue,
      totalProfitLoss: totalPnL,
      overallROI: overallReturnPct,
      currency: 'INR (₹)',
      assetAllocation,
    },
  };
}

async function handleListSalaries(db, userId, args) {
  const limit = Number(args.limit) || 12;
  const snap = await db.collection('salaries').where('userId', '==', userId).get();

  let items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

  // In-memory sort by receivedDate desc
  items.sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0));

  return {
    count: Math.min(items.length, limit),
    salaries: items.slice(0, limit),
  };
}

async function handleAddSalary(db, userId, args) {
  const amount = Number(args.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount must be a positive number.');
  }

  const salaryMonth = (args.salaryMonth || 'Salary').trim();
  const receivedDate = args.receivedDate || new Date().toISOString().split('T')[0];
  const companyOrSource = (args.companyOrSource || '').trim();
  const status = args.status === 'pending' ? 'pending' : 'received';
  const notes = (args.notes || '').trim();

  const payload = {
    userId,
    salaryMonth,
    amount,
    receivedDate,
    companyOrSource,
    status,
    notes,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'mcp_assistant',
  };

  const docRef = await db.collection('salaries').add(payload);

  return {
    success: true,
    salaryId: docRef.id,
    ...payload,
    message: `Logged salary for ${salaryMonth} of ₹${amount.toFixed(2)}${companyOrSource ? ` from ${companyOrSource}` : ''}.`,
  };
}

async function handleDeleteSalary(db, userId, args) {
  const { salaryId } = args;
  if (!salaryId) throw new Error('salaryId is required.');

  const ref = db.collection('salaries').doc(salaryId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Salary record ${salaryId} not found.`);
  if (snap.data().userId !== userId) throw new Error('Unauthorized.');

  await ref.delete();

  return {
    success: true,
    deletedId: salaryId,
    message: `Salary record for ${snap.data().salaryMonth} deleted.`,
  };
}

async function handleGetAnalytics(db, userId, args) {
  const targetMonth = args.month; // e.g. "2026-07" or undefined
  const snap = await db.collection('transactions').where('userId', '==', userId).get();

  let allTxs = [];
  snap.forEach((d) => allTxs.push({ id: d.id, ...d.data() }));

  if (targetMonth && targetMonth !== 'all') {
    allTxs = allTxs.filter((t) => (t.date || '').startsWith(targetMonth));
  }

  let totalExpenses = 0;
  let totalIncome = 0;
  let onlineExpense = 0;
  let cashExpense = 0;
  const categoryMap = {};
  const dailySpendMap = {};
  const monthMap = {};

  allTxs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const dateStr = t.date || '';

    // Month group
    const m = dateStr.slice(0, 7);
    if (m) {
      if (!monthMap[m]) monthMap[m] = { expense: 0, income: 0 };
      if (t.type === 'expense') monthMap[m].expense += amt;
      else if (t.type === 'income') monthMap[m].income += amt;
    }

    if (t.type === 'expense') {
      totalExpenses += amt;
      const cat = t.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;

      if (t.paymentMethod === 'cash') cashExpense += amt;
      else onlineExpense += amt;

      if (dateStr) {
        dailySpendMap[dateStr] = (dailySpendMap[dateStr] || 0) + amt;
      }
    } else if (t.type === 'income') {
      totalIncome += amt;
    }
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? `${Math.round((amount / totalExpenses) * 100)}%` : '0%',
    }));

  const activeDays = Object.keys(dailySpendMap).length;
  const dailyAverage = activeDays > 0 ? Math.round(totalExpenses / activeDays) : 0;

  const peakDay = Object.entries(dailySpendMap)
    .sort(([, a], [, b]) => b - a)[0] || null;

  const monthlyTrends = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      expense: data.expense,
      income: data.income,
      net: data.income - data.expense,
    }));

  return {
    period: targetMonth || 'All Time / Selected Period',
    overview: {
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? `${Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)}%` : '0%',
      dailyAverageExpense: dailyAverage,
      peakSpendingDay: peakDay ? { date: peakDay[0], amount: peakDay[1] } : null,
    },
    paymentMethods: {
      onlineExpense,
      cashExpense,
      onlinePercentage: totalExpenses > 0 ? `${Math.round((onlineExpense / totalExpenses) * 100)}%` : '0%',
      cashPercentage: totalExpenses > 0 ? `${Math.round((cashExpense / totalExpenses) * 100)}%` : '0%',
    },
    categoryBreakdown,
    monthlyTrends,
  };
}

// ==========================================
// VERCEL SERVERLESS FUNCTION HANDLER
// ==========================================

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

  // 1. Unauthenticated MCP handshakes: initialize, notifications, ping
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
        // Transactions
        case 'add_transaction':
          resultData = await handleAddTransaction(db, userId, args);
          break;
        case 'list_transactions':
          resultData = await handleListTransactions(db, userId, args);
          break;
        case 'get_transaction':
          resultData = await handleGetTransaction(db, userId, args);
          break;
        case 'update_transaction':
          resultData = await handleUpdateTransaction(db, userId, args);
          break;
        case 'delete_transaction':
          resultData = await handleDeleteTransaction(db, userId, args);
          break;

        // Balances & Summary
        case 'get_summary':
          resultData = await handleGetSummary(db, userId);
          break;
        case 'update_balances':
          resultData = await handleUpdateBalances(db, userId, args);
          break;

        // Budget
        case 'get_budget':
          resultData = await handleGetBudget(db, userId);
          break;
        case 'set_budget':
          resultData = await handleSetBudget(db, userId, args);
          break;

        // Recurring
        case 'list_recurring_transactions':
          resultData = await handleListRecurring(db, userId, args);
          break;
        case 'add_recurring_transaction':
          resultData = await handleAddRecurring(db, userId, args);
          break;
        case 'delete_recurring_transaction':
          resultData = await handleDeleteRecurring(db, userId, args);
          break;

        // Bill Splitting & Debts
        case 'split_expense':
          resultData = await handleSplitExpense(db, userId, args);
          break;
        case 'get_debts':
          resultData = await handleGetDebts(db, userId, args);
          break;
        case 'settle_debt':
          resultData = await handleSettleDebt(db, userId, args);
          break;

        // Friends
        case 'list_friends':
          resultData = await handleListFriends(db, userId);
          break;
        case 'add_friend':
          resultData = await handleAddFriend(db, userId, args);
          break;

        // Investments
        case 'list_investments':
          resultData = await handleListInvestments(db, userId, args);
          break;
        case 'add_investment':
          resultData = await handleAddInvestment(db, userId, args);
          break;
        case 'update_investment':
          resultData = await handleUpdateInvestment(db, userId, args);
          break;
        case 'delete_investment':
          resultData = await handleDeleteInvestment(db, userId, args);
          break;
        case 'get_portfolio_summary':
          resultData = await handleGetPortfolioSummary(db, userId);
          break;

        // Salary
        case 'list_salaries':
          resultData = await handleListSalaries(db, userId, args);
          break;
        case 'add_salary':
          resultData = await handleAddSalary(db, userId, args);
          break;
        case 'delete_salary':
          resultData = await handleDeleteSalary(db, userId, args);
          break;

        // Analytics
        case 'get_analytics':
          resultData = await handleGetAnalytics(db, userId, args);
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
