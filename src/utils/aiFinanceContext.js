const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function normalizeAmount(value) {
  const parsed = Number.parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(dateValue) {
  if (!dateValue) return null;

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  if (typeof dateValue?.toDate === 'function') {
    return dateValue.toDate().toISOString().split('T')[0];
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return null;
}

function sortByDateDescending(left, right) {
  return new Date(right.date ?? 0).getTime() - new Date(left.date ?? 0).getTime();
}

export function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(normalizeAmount(value));
}

export function serializeTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type ?? 'expense',
    amount: normalizeAmount(transaction.amount),
    totalPaid: normalizeAmount(transaction.totalPaid ?? transaction.amount),
    category: transaction.category ?? 'Other',
    description: transaction.description ?? '',
    date: normalizeDate(transaction.date),
    paymentMethod: transaction.paymentMethod ?? 'online',
    affectCurrentBalance: transaction.affectCurrentBalance !== false,
    isSplit: Boolean(transaction.isSplit),
    isBalanceAdjustment: Boolean(transaction.isBalanceAdjustment),
  };
}

function buildCategoryTotals(transactions) {
  return transactions.reduce((accumulator, transaction) => {
    if (transaction.type !== 'expense') {
      return accumulator;
    }

    const key = transaction.category || 'Other';
    accumulator[key] = normalizeAmount(accumulator[key]) + normalizeAmount(transaction.amount);
    return accumulator;
  }, {});
}

function buildPaymentMethodTotals(transactions) {
  return transactions.reduce((accumulator, transaction) => {
    if (transaction.type !== 'expense') {
      return accumulator;
    }

    const key = transaction.paymentMethod || 'unknown';
    accumulator[key] = normalizeAmount(accumulator[key]) + normalizeAmount(transaction.totalPaid ?? transaction.amount);
    return accumulator;
  }, {});
}

function buildMonthlyTotals(transactions) {
  return transactions.reduce((accumulator, transaction) => {
    if (transaction.type !== 'expense' || !transaction.date) {
      return accumulator;
    }

    const monthKey = transaction.date.slice(0, 7);
    accumulator[monthKey] = normalizeAmount(accumulator[monthKey]) + normalizeAmount(transaction.amount);
    return accumulator;
  }, {});
}

export function buildAssistantContext({
  transactions = [],
  budget = null,
  balances = null,
  now = new Date(),
}) {
  const normalizedTransactions = transactions
    .map(serializeTransaction)
    .filter((transaction) => transaction.date)
    .sort(sortByDateDescending);

  const currentMonthKey = now.toISOString().slice(0, 7);
  const expenseTransactions = normalizedTransactions.filter((transaction) => transaction.type === 'expense');
  const currentMonthExpenses = expenseTransactions.filter(
    (transaction) => transaction.date?.startsWith(currentMonthKey),
  );

  const totalExpenses = expenseTransactions.reduce(
    (sum, transaction) => sum + normalizeAmount(transaction.amount),
    0,
  );
  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, transaction) => sum + normalizeAmount(transaction.amount),
    0,
  );

  const categoryTotals = buildCategoryTotals(expenseTransactions);
  const currentMonthCategoryTotals = buildCategoryTotals(currentMonthExpenses);
  const paymentMethodTotals = buildPaymentMethodTotals(expenseTransactions);
  const monthlyTotals = buildMonthlyTotals(expenseTransactions);

  const topCategories = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([category, amount]) => ({
      category,
      amount,
      formattedAmount: formatCurrency(amount),
    }));

  return {
    generatedAt: now.toISOString(),
    budget: budget
      ? {
          monthlyLimit: normalizeAmount(budget.monthlyLimit),
          formattedMonthlyLimit: formatCurrency(budget.monthlyLimit),
        }
      : null,
    balances: balances
      ? {
          online: normalizeAmount(balances.online),
          cash: normalizeAmount(balances.cash),
          total: normalizeAmount(balances.online) + normalizeAmount(balances.cash),
          formattedOnline: formatCurrency(balances.online),
          formattedCash: formatCurrency(balances.cash),
          formattedTotal: formatCurrency(
            normalizeAmount(balances.online) + normalizeAmount(balances.cash),
          ),
        }
      : null,
    metrics: {
      transactionCount: normalizedTransactions.length,
      expenseCount: expenseTransactions.length,
      totalExpenses,
      currentMonthTotal,
      formattedTotalExpenses: formatCurrency(totalExpenses),
      formattedCurrentMonthTotal: formatCurrency(currentMonthTotal),
    },
    summaries: {
      topCategories,
      categoryTotals,
      currentMonthCategoryTotals,
      paymentMethodTotals,
      monthlyTotals,
    },
    recentTransactions: normalizedTransactions.slice(0, 30),
    transactionReference: normalizedTransactions.slice(0, 50).map((transaction) => ({
      id: transaction.id,
      label: transaction.description || transaction.category,
      date: transaction.date,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      type: transaction.type,
    })),
  };
}
