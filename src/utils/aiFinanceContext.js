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

function sortInvestmentsByDateDescending(left, right) {
  return new Date(right.purchaseDate ?? 0).getTime() - new Date(left.purchaseDate ?? 0).getTime();
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

export function serializeInvestment(investment) {
  const investedAmount = normalizeAmount(investment.investedAmount ?? investment.amount);
  const currentValue =
    investment.currentValue !== undefined && investment.currentValue !== null
      ? normalizeAmount(investment.currentValue)
      : investedAmount;
  const gainLoss = currentValue - investedAmount;
  const gainLossPercentage =
    investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0;

  return {
    id: investment.id,
    name: investment.name || 'Investment',
    assetType: investment.assetType || 'other',
    provider: investment.provider || 'Direct',
    investedAmount,
    currentValue,
    gainLoss,
    gainLossPercentage: Number(gainLossPercentage.toFixed(2)),
    formattedInvestedAmount: formatCurrency(investedAmount),
    formattedCurrentValue: formatCurrency(currentValue),
    formattedGainLoss: formatCurrency(gainLoss),
    purchaseDate: normalizeDate(investment.purchaseDate || investment.date),
    maturityDate: normalizeDate(investment.maturityDate),
    interestRate:
      investment.interestRate !== undefined && investment.interestRate !== null
        ? normalizeAmount(investment.interestRate)
        : null,
    units:
      investment.units !== undefined && investment.units !== null
        ? normalizeAmount(investment.units)
        : null,
    notes: investment.notes || '',
  };
}

function buildAssetTypeBreakdown(investments) {
  return investments.reduce((accumulator, investment) => {
    const key = investment.assetType || 'other';
    if (!accumulator[key]) {
      accumulator[key] = {
        count: 0,
        investedAmount: 0,
        currentValue: 0,
        gainLoss: 0,
        gainLossPercentage: 0,
        formattedInvestedAmount: formatCurrency(0),
        formattedCurrentValue: formatCurrency(0),
        formattedGainLoss: formatCurrency(0),
      };
    }

    accumulator[key].count += 1;
    accumulator[key].investedAmount += investment.investedAmount;
    accumulator[key].currentValue += investment.currentValue;
    accumulator[key].gainLoss += investment.gainLoss;
    accumulator[key].gainLossPercentage =
      accumulator[key].investedAmount > 0
        ? Number(((accumulator[key].gainLoss / accumulator[key].investedAmount) * 100).toFixed(2))
        : 0;
    accumulator[key].formattedInvestedAmount = formatCurrency(accumulator[key].investedAmount);
    accumulator[key].formattedCurrentValue = formatCurrency(accumulator[key].currentValue);
    accumulator[key].formattedGainLoss = formatCurrency(accumulator[key].gainLoss);

    return accumulator;
  }, {});
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
  investments = [],
  now = new Date(),
}) {
  const normalizedTransactions = transactions
    .map(serializeTransaction)
    .filter((transaction) => transaction.date)
    .sort(sortByDateDescending);

  const normalizedInvestments = investments
    .map(serializeInvestment)
    .sort(sortInvestmentsByDateDescending);

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

  const totalInvested = normalizedInvestments.reduce(
    (sum, inv) => sum + inv.investedAmount,
    0,
  );
  const totalPortfolioValue = normalizedInvestments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0,
  );
  const totalGainLoss = totalPortfolioValue - totalInvested;
  const totalGainLossPercentage =
    totalInvested > 0 ? Number(((totalGainLoss / totalInvested) * 100).toFixed(2)) : 0;

  const breakdownByAssetType = buildAssetTypeBreakdown(normalizedInvestments);
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
    investments: {
      count: normalizedInvestments.length,
      totalPortfolioValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage,
      formattedTotalPortfolioValue: formatCurrency(totalPortfolioValue),
      formattedTotalInvested: formatCurrency(totalInvested),
      formattedTotalGainLoss: formatCurrency(totalGainLoss),
      breakdownByAssetType,
    },
    metrics: {
      transactionCount: normalizedTransactions.length,
      expenseCount: expenseTransactions.length,
      totalExpenses,
      currentMonthTotal,
      formattedTotalExpenses: formatCurrency(totalExpenses),
      formattedCurrentMonthTotal: formatCurrency(currentMonthTotal),
      investmentCount: normalizedInvestments.length,
      totalPortfolioValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage,
      formattedTotalPortfolioValue: formatCurrency(totalPortfolioValue),
      formattedTotalInvested: formatCurrency(totalInvested),
      formattedTotalGainLoss: formatCurrency(totalGainLoss),
    },
    summaries: {
      topCategories,
      categoryTotals,
      currentMonthCategoryTotals,
      paymentMethodTotals,
      monthlyTotals,
      breakdownByAssetType,
      assetTypeBreakdown: breakdownByAssetType,
      investmentSummary: {
        totalPortfolioValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercentage,
        formattedTotalPortfolioValue: formatCurrency(totalPortfolioValue),
        formattedTotalInvested: formatCurrency(totalInvested),
        formattedTotalGainLoss: formatCurrency(totalGainLoss),
        breakdownByAssetType,
      },
    },
    recentTransactions: normalizedTransactions.slice(0, 15),
    transactionReference: normalizedTransactions.slice(0, 20).map((transaction) => ({
      id: transaction.id,
      label: transaction.description || transaction.category,
      date: transaction.date,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      type: transaction.type,
    })),
    recentInvestments: normalizedInvestments.slice(0, 10),
    investmentReference: normalizedInvestments.slice(0, 15).map((inv) => ({
      id: inv.id,
      name: inv.name,
      assetType: inv.assetType,
      provider: inv.provider,
      investedAmount: inv.investedAmount,
      currentValue: inv.currentValue,
      gainLoss: inv.gainLoss,
      purchaseDate: inv.purchaseDate,
    })),
  };
}
