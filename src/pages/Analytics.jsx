import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, LogOut, Filter, TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AiChatbot from '../components/AiChatbot';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)] font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const avgPerCategory = Object.values(expensesByCategory).length > 0 
      ? totalExpenses / Object.values(expensesByCategory).length
      : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo area */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--primary-600)] transition-colors">
                 <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--primary-700)] to-[var(--accent-600)] bg-clip-text text-transparent">
                  Analytics
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Financial Insights
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
               <div className="hidden md:block text-right mr-2">
                 <p className="text-xs font-semibold text-[var(--text-tertiary)]">Logged in as</p>
                 <p className="text-sm font-bold text-[var(--text-primary)]">
                   {currentUser.email?.split('@')[0]}
                 </p>
               </div>
               <button
                 onClick={logout}
                 className="p-2 rounded-xl text-[var(--danger-600)] hover:bg-[var(--danger-50)] transition-colors"
                 title="Logout"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {transactions.length === 0 ? (
          <div className="premium-card text-center p-12 animate-fade-scale flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-24 h-24 mb-6 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
                <BarChart2 className="w-12 h-12 text-[var(--primary-300)]" />
             </div>
             <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No data yet</h3>
             <p className="text-[var(--text-secondary)] max-w-sm mb-8">
                Start adding transactions to unlock powerful insights about your spending habits.
             </p>
             <Link 
                to="/dashboard"
                className="btn-primary"
             >
                Go to Dashboard
             </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h2>
                  <p className="text-[var(--text-secondary)]">Analyze your spending patterns</p>
               </div>
               
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </div>
                  <select
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="input-premium pl-10 pr-10 py-2.5 min-w-[200px]"
                  >
                     <option value="all">All Time</option>
                     {availableMonths.map(month => (
                        <option key={month} value={month}>{month}</option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="premium-card p-6 flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-[var(--danger-50)] text-[var(--danger-600)]">
                     <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-[var(--text-secondary)]">Total Expenses</p>
                     <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                        ₹{totalExpenses.toFixed(2)}
                     </h3>
                  </div>
               </div>
               
               <div className="premium-card p-6 flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-[var(--accent-50)] text-[var(--accent-600)]">
                     <PieChart className="w-8 h-8" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-[var(--text-secondary)]">Active Categories</p>
                     <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                        {Object.keys(expensesByCategory).length}
                     </h3>
                  </div>
               </div>

               <div className="premium-card p-6 flex items-center space-x-4">
                  <div className="p-4 rounded-2xl bg-[var(--success-50)] text-[var(--success-600)]">
                     <BarChart2 className="w-8 h-8" />
                  </div>
                  <div>
                     <p className="text-sm font-medium text-[var(--text-secondary)]">Avg. per Category</p>
                     <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                        ₹{avgPerCategory.toFixed(2)}
                     </h3>
                  </div>
               </div>
            </div>

            <AiChatbot
              mode="embedded"
              title="Analytics AI"
              subtitle="Ask for trends, categories, and instant record changes"
              suggestions={[
                'What are my top spending categories this month?',
                'How much did I spend on non veg this month?',
                'Update my latest sugar cane juice expense to 90 rupees',
              ]}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Category Breakdown (Pie) */}
              <div className="premium-card p-6 h-[500px] flex flex-col">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-[var(--text-primary)]">Expense Breakdown</h3>
                       <p className="text-xs text-[var(--text-secondary)]">By Category</p>
                    </div>
                 </div>
                 
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={100}
                             paddingAngle={5}
                             dataKey="value"
                          >
                             {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value) => `₹${value.toFixed(2)}`}
                             contentStyle={{
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--card-border)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: 'var(--text-primary)'
                             }}
                             itemStyle={{ color: 'var(--text-primary)' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Custom Legend */}
                 <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[120px] pr-2">
                    {pieData.map((entry, index) => (
                       <div key={entry.name} className="flex items-center space-x-2 text-xs">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-[var(--text-secondary)] truncate">{entry.name}</span>
                          <span className="font-semibold text-[var(--text-primary)] ml-auto">
                             {((entry.value / totalExpenses) * 100).toFixed(0)}%
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Monthly Trend (Bar) */}
              <div className="premium-card p-6 h-[500px] flex flex-col">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-[var(--text-primary)]">Monthly Trend</h3>
                       <p className="text-xs text-[var(--text-secondary)]">Spending over time</p>
                    </div>
                 </div>

                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                          <XAxis 
                             dataKey="month" 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                             dy={10}
                          />
                          <YAxis 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                             tickFormatter={(value) => `₹${value}`}
                          />
                          <Tooltip 
                             cursor={{ fill: 'var(--bg-tertiary)' }}
                             contentStyle={{
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--card-border)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: 'var(--text-primary)'
                             }}
                             formatter={(value) => [`₹${value.toFixed(2)}`, 'Spent']}
                             labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
                          />
                          <Bar 
                             dataKey="amount" 
                             fill="var(--accent-500)"
                             radius={[8, 8, 0, 0]}
                             barSize={40}
                          />
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
