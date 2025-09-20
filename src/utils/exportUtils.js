import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Export transactions to PDF
export const exportToPDF = (transactions) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('SpendWise - Transaction Report', 20, 20);
  
  // Add date range
  doc.setFontSize(12);
  const today = new Date().toLocaleDateString('en-IN');
  doc.text(`Generated on: ${today}`, 20, 35);
  
  // Generate summary
  const summary = generateSummaryReport(transactions);
  doc.text(`Total Transactions: ${transactions.length}`, 20, 45);
  doc.text(`Total Income: ₹${summary.totalIncome.toFixed(2)}`, 20, 55);
  doc.text(`Total Expenses: ₹${summary.totalExpenses.toFixed(2)}`, 20, 65);
  doc.text(`Balance: ₹${summary.balance.toFixed(2)}`, 20, 75);
  
  // Prepare table data
  const tableData = transactions.map(transaction => [
    transaction.date,
    transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    transaction.category,
    transaction.description || '-',
    `₹${transaction.amount.toFixed(2)}`
  ]);
  
  // Add table
  doc.autoTable({
    head: [['Date', 'Type', 'Category', 'Description', 'Amount (₹)']],
    body: tableData,
    startY: 85,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Light gray
    }
  });
  
  // Save the PDF
  const fileName = `spendwise-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Export transactions to Excel
export const exportToExcel = (transactions) => {
  // Prepare data for Excel
  const excelData = transactions.map(transaction => ({
    'Date': transaction.date,
    'Type': transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    'Category': transaction.category,
    'Description': transaction.description || '-',
    'Amount (₹)': transaction.amount.toFixed(2)
  }));
  
  // Generate summary data
  const summary = generateSummaryReport(transactions);
  const summaryData = [
    { 'Summary': 'Total Transactions', 'Value': transactions.length },
    { 'Summary': 'Total Income', 'Value': `₹${summary.totalIncome.toFixed(2)}` },
    { 'Summary': 'Total Expenses', 'Value': `₹${summary.totalExpenses.toFixed(2)}` },
    { 'Summary': 'Balance', 'Value': `₹${summary.balance.toFixed(2)}` },
    { 'Summary': 'Report Generated', 'Value': new Date().toLocaleDateString('en-IN') }
  ];
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add transactions sheet
  const ws1 = XLSX.utils.json_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Transactions');
  
  // Add summary sheet
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
  
  // Add category breakdown sheet if there are expenses
  if (summary.expensesByCategory && Object.keys(summary.expensesByCategory).length > 0) {
    const categoryData = Object.entries(summary.expensesByCategory).map(([category, amount]) => ({
      'Category': category,
      'Amount (₹)': amount.toFixed(2),
      'Percentage': `${((amount / summary.totalExpenses) * 100).toFixed(1)}%`
    }));
    const ws3 = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Category Breakdown');
  }
  
  // Save the Excel file
  const fileName = `spendwise-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Generate summary report with rupee formatting
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
    topSpendingCategory: topCategory ? { 
      category: topCategory[0], 
      amount: topCategory[1],
      formattedAmount: `₹${topCategory[1].toFixed(2)}`
    } : null,
    dateRange: {
      start: transactions.length > 0 ? Math.min(...transactions.map(t => new Date(t.date))) : null,
      end: transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.date))) : null
    },
    // Formatted currency values
    formattedIncome: `₹${totalIncome.toFixed(2)}`,
    formattedExpenses: `₹${totalExpenses.toFixed(2)}`,
    formattedBalance: `₹${(totalIncome - totalExpenses).toFixed(2)}`
  };
};