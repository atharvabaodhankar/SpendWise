import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, LogOut, Filter, TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AiChatbot from '../components/AiChatbot';

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6'];

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

  // Monthly spending data
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
      <div className="min-h-screen flex items-center justify-center bg-[#0b1326]">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-[#10b981] rounded-full animate-spin mb-4"></div>
            <p className="text-[#94a3b8] font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>Loading Financial Analytics...</p>
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
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--slate)] font-sans antialiased pb-20">
      {/* Header */}
      <header className="flex items-center justify-between max-w-[1120px] mx-auto px-6 py-8 border-b border-[var(--hairline)] mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="btn-statement text-[10px] py-2 px-3 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Statement
          </Link>
          <div className="brand-text">
            <div className="text-lg font-semibold tracking-wider text-[var(--navy)] uppercase">Financial Analytics</div>
            <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-medium mt-0.5">Distribution & trend reports</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <div className="text-[9px] tracking-[1.5px] text-[var(--slate-light)] uppercase font-semibold">Logged in as</div>
            <div className="font-mono text-xs text-[var(--navy-muted)] mt-0.5 font-medium">
              {currentUser.email?.split('@')[0]}
            </div>
          </div>
          <button onClick={logout} className="btn-statement text-[10px] hover:border-[var(--rose)] hover:text-[var(--rose)]">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto px-6 space-y-8">
        {transactions.length === 0 ? (
          <div className="statement-card text-center p-12 flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 mb-4 bg-[var(--slate-faint)] rounded-lg flex items-center justify-center">
              <BarChart2 className="w-8 h-8 text-[var(--slate-light)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--navy)] mb-1">No data to analyze</h3>
            <p className="text-xs text-[var(--slate-light)] max-w-sm mb-6">
              Start recording expenses on your statement to generate analytics.
            </p>
            <Link to="/dashboard" className="btn-statement-primary text-[10px]">
              Go to Statement
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
              <div>
                <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold">Visual Breakdown</div>
                <h2 className="text-2xl font-semibold text-[var(--navy)] tracking-tight mt-1">Expense Metrics</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--slate-light)] uppercase">Filter:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-premium py-2 px-4 text-xs font-mono min-w-[180px]"
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
              <div className="statement-card p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Total Outlays</div>
                <div className="font-mono text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="statement-card p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Active Categories</div>
                <div className="font-mono text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  {Object.keys(expensesByCategory).length}
                </div>
              </div>

              <div className="statement-card p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Avg per Category</div>
                <div className="font-mono text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  ₹{avgPerCategory.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <AiChatbot
              mode="embedded"
              title="Analytics Financial AI"
              subtitle="Ask for spending category insights or financial advice"
              suggestions={[
                'What are my top spending categories this month?',
                'How much did I spend on Food & Dining recently?',
                'Give me advice to cut my expenses by 15%',
              ]}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Category Breakdown (Pie) */}
              <div className="glass-card p-6 h-[500px] flex flex-col border border-white/10">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Expense Breakdown</h3>
                       <p className="text-xs text-[#94a3b8]">Distribution across categories</p>
                    </div>
                 </div>
                 
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={65}
                             outerRadius={105}
                             paddingAngle={6}
                             dataKey="value"
                          >
                             {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0b1326" strokeWidth={3} />
                             ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value) => `₹${value.toFixed(2)}`}
                             contentStyle={{
                                backgroundColor: '#131b2e',
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                color: '#ffffff'
                             }}
                             itemStyle={{ color: '#10b981', fontFamily: 'Geist, sans-serif', fontWeight: 'bold' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Custom Legend */}
                 <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[120px] pr-2">
                    {pieData.map((entry, index) => (
                       <div key={entry.name} className="flex items-center space-x-2 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-[#94a3b8] truncate">{entry.name}</span>
                          <span className="font-bold text-white ml-auto" style={{ fontFamily: 'Geist, sans-serif' }}>
                             {((entry.value / totalExpenses) * 100).toFixed(0)}%
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Monthly Trend (Bar) */}
              <div className="glass-card p-6 h-[500px] flex flex-col border border-white/10">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Monthly Spending Trend</h3>
                       <p className="text-xs text-[#94a3b8]">Historical spending timeline</p>
                    </div>
                 </div>

                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                          <XAxis 
                             dataKey="month" 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Geist, sans-serif' }}
                             dy={10}
                          />
                          <YAxis 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Geist, sans-serif' }}
                             tickFormatter={(value) => `₹${value}`}
                          />
                          <Tooltip 
                             cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                             contentStyle={{
                                backgroundColor: '#131b2e',
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                borderRadius: '16px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                                color: '#ffffff'
                             }}
                             formatter={(value) => [`₹${value.toFixed(2)}`, 'Outlay']}
                             labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem', fontFamily: 'Geist, sans-serif' }}
                          />
                          <Bar 
                             dataKey="amount" 
                             fill="#10b981"
                             radius={[8, 8, 0, 0]}
                             barSize={36}
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
