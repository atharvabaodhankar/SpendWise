import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const { currentUser, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transactionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Get unique months from transactions
  const availableMonths = [...new Set(
    transactions
      .filter(t => t.type === 'expense')
      .map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
  )].sort((a, b) => new Date(a) - new Date(b));

  // Filter transactions based on selected month
  const filteredTransactions = selectedMonth === 'all' 
    ? transactions 
    : transactions.filter(t => {
        const transactionMonth = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return transactionMonth === selectedMonth;
      });

  // Process data for charts
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Monthly spending data (always show all months for the bar chart)
  const monthlyData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + transaction.amount;
      return acc;
    }, {});

  const barData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="text-center animate-fade-scale">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="SpendWise Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xl font-semibold text-slate-700 mb-2">
            Loading Analytics
          </div>
          <div className="w-32 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-slate-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Premium Responsive Header */}
      <header className="glass-card border-0 border-b border-white/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="SpendWise Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Spending Insights & Reports
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a 
                href="/dashboard" 
                className="flex items-center space-x-1 sm:space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200 text-sm font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="hidden sm:inline">Dashboard</span>
              </a>
              <div className="hidden md:block text-right">
                <p className="text-xs font-medium text-slate-600">Welcome back,</p>
                <p className="text-sm font-semibold text-slate-800">
                  {currentUser.email?.split('@')[0]}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="sm:hidden">Exit</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {transactions.length === 0 ? (
          <div className="premium-card text-center p-8 sm:p-12 animate-fade-scale">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden">
              <img 
                src="/logo.png" 
                alt="SpendWise Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">No data to analyze yet</h3>
            <p className="text-slate-600 mb-6 text-sm sm:text-base">Add some transactions to see your spending patterns and insights!</p>
            <a 
              href="/dashboard" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-slate-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Add Transactions</span>
              <span>→</span>
            </a>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 animate-slide-up">
            {/* Month Filter */}
            <div className="premium-card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white text-sm">📅</span>
                    </div>
                    <span>Filter by Month</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 ml-11">View analytics for specific months</p>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:border-indigo-300"
                  >
                    <option value="all">All Months</option>
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Stats - Mobile First */}
            <div className="premium-card bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 border-indigo-100/50 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-slate-700 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-sm">📊</span>
                </div>
                <span>Spending Summary {selectedMonth !== 'all' && `- ${selectedMonth}`}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-2">
                    ₹{Object.values(expensesByCategory).reduce((a, b) => a + b, 0).toFixed(2)}
                  </div>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">Total Expenses</p>
                </div>
                <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">
                    {Object.keys(expensesByCategory).length}
                  </div>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">Categories</p>
                </div>
                <div className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">
                    ₹{Object.values(expensesByCategory).length > 0 
                      ? (Object.values(expensesByCategory).reduce((a, b) => a + b, 0) / Object.values(expensesByCategory).length).toFixed(2)
                      : '0.00'
                    }
                  </div>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">Avg per Category</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Expenses by Category */}
              <div className="premium-card p-4 sm:p-6 group">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🥧</span>
                  </div>
                  <span className="truncate">Expenses by Category {selectedMonth !== 'all' && `- ${selectedMonth}`}</span>
                </h2>
                <div className="h-64 sm:h-80 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => window.innerWidth > 640 ? `${name} ${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`}
                        outerRadius={window.innerWidth > 640 ? 100 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Mobile Legend */}
                <div className="mt-4 sm:hidden">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Spending */}
              <div className="premium-card p-4 sm:p-6 group">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                    <span className="text-white text-sm">📈</span>
                  </div>
                  <span className="truncate">Monthly Spending</span>
                </h2>
                <div className="h-64 sm:h-80 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        fontSize={window.innerWidth > 640 ? 12 : 10}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        stroke="#64748b"
                      />
                      <YAxis 
                        fontSize={window.innerWidth > 640 ? 12 : 10}
                        stroke="#64748b"
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1e40af" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}