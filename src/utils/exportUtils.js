// Export transactions to CSV
export const exportToCSV = (transactions) => {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  
  const csvContent = [
    headers.join(','),
    ...transactions.map(transaction => [
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.description || '',
      transaction.amount.toFixed(2)
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `spendwise-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Generate summary report
export const generateSummaryReport = (transactions) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {});

  const topCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    expensesByCategory,
    topSpendingCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
    dateRange: {
      start: transactions.length > 0 ? Math.min(...transactions.map(t => new Date(t.date))) : null,
      end: transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.date))) : null
    }
  };
};