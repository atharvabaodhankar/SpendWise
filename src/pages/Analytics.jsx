import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChevronLeft, LogOut, TrendingUp, PieChart as PieIcon, BarChart2, Sun, Moon, Menu, X, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AiChatbot from '../components/AiChatbot';
import SpendWiseLogo from '../components/SpendWiseLogo';

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#3B82F6'];

export default function Analytics() {
  const { currentUser, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

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

  const pieData = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ name: category, value: amount }))
    .sort((a, b) => b.value - a.value);

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

  // Daily spending data for selected month
  const dailyData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const day = new Date(t.date).getDate();
      acc[day] = (acc[day] || 0) + t.amount;
      return acc;
    }, {});

  const lineData = Object.entries(dailyData)
    .map(([day, amount]) => ({ day: `Day ${day}`, amount }))
    .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));

  // Tooltip styles — theme-aware
  const tooltipStyle = {
    backgroundColor: 'var(--white)',
    borderColor: 'var(--hairline)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    color: 'var(--navy)',
    fontFamily: 'Geist, sans-serif',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--slate-faint)] border-t-[var(--navy)] rounded-full animate-spin" />
          <span className="text-xs tracking-widest uppercase text-[var(--slate-light)] font-mono">Loading Analytics</span>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const avgPerCategory = Object.values(expensesByCategory).length > 0 
      ? totalExpenses / Object.values(expensesByCategory).length
      : 0;
  const topCategory = pieData.length > 0 ? pieData[0] : null;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--slate)] font-sans antialiased transition-colors duration-200">

      {/* ── TOP NAV (matching Dashboard) ── */}
      <nav className="sticky top-0 z-40 bg-[var(--white)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <SpendWiseLogo size={32} />
            <span className="font-semibold text-[var(--navy)] tracking-tight text-base hidden sm:block">SpendWise</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--slate)] hover:text-[var(--navy)] hover:bg-[var(--canvas)] transition-all flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="px-3 py-1.5 rounded-md text-xs font-semibold text-[var(--navy)] bg-[var(--slate-faint)]">Analytics</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded-lg border border-[var(--hairline)] bg-[var(--white)] flex items-center justify-center hover:border-[var(--slate-light)] transition-all"
              title="Toggle theme">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--slate)]" />}
            </button>
            <Link to="/dashboard" className="sm:hidden btn-statement text-[10px] py-1.5 px-2.5 flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <button onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--white)] text-xs font-medium text-[var(--slate)] hover:border-[var(--rose)] hover:text-[var(--rose)] transition-all">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-20">
        {transactions.length === 0 ? (
          <div className="statement-card text-center p-8 sm:p-12 flex flex-col items-center justify-center min-h-[350px]">
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
          <div className="space-y-6 sm:space-y-8">

            {/* Page header + Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[var(--navy)] tracking-tight">Expense Analytics</h1>
                <p className="text-xs sm:text-sm text-[var(--slate-light)] mt-0.5">Distribution & trend reports</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--slate-light)] uppercase">Filter:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-premium py-2 px-3 sm:px-4 text-xs font-mono min-w-[140px] sm:min-w-[180px]"
                >
                  <option value="all">All Time</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="statement-card p-5 sm:p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Total Outlays</div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="statement-card p-5 sm:p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Active Categories</div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  {Object.keys(expensesByCategory).length}
                </div>
              </div>

              <div className="statement-card p-5 sm:p-6">
                <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Avg per Category</div>
                <div className="font-mono text-2xl sm:text-3xl font-semibold text-[var(--navy)] mt-2 tabular-nums">
                  ₹{avgPerCategory.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {topCategory && (
                <div className="statement-card p-5 sm:p-6">
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[var(--slate-light)] font-semibold">Top Category</div>
                  <div className="font-mono text-lg sm:text-xl font-semibold text-[var(--navy)] mt-2 truncate">{topCategory.name}</div>
                  <div className="text-xs text-[var(--slate-light)] font-mono mt-0.5">
                    ₹{topCategory.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({((topCategory.value / totalExpenses) * 100).toFixed(0)}%)
                  </div>
                </div>
              )}
            </div>

            {/* AI Chatbot — embedded */}
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              {/* Category Breakdown (Pie) */}
              <div className="statement-card p-5 sm:p-6 h-[400px] sm:h-[500px] flex flex-col">
                 <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                       <h3 className="text-sm sm:text-base font-semibold text-[var(--navy)] uppercase tracking-wider">Expense Breakdown</h3>
                       <p className="text-[10px] sm:text-xs text-[var(--slate-light)] mt-0.5">Distribution across categories</p>
                    </div>
                 </div>
                 
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={50}
                             outerRadius={85}
                             paddingAngle={4}
                             dataKey="value"
                          >
                             {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--white)" strokeWidth={2} />
                             ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value) => `₹${value.toFixed(2)}`}
                             contentStyle={tooltipStyle}
                             itemStyle={{ color: 'var(--emerald)', fontWeight: 'bold' }}
                          />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Custom Legend */}
                 <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 overflow-y-auto max-h-[100px] sm:max-h-[120px] pr-2">
                    {pieData.map((entry, index) => (
                       <div key={entry.name} className="flex items-center space-x-2 text-[10px] sm:text-xs bg-[var(--canvas)] border border-[var(--hairline)] px-2.5 sm:px-3 py-1.5 rounded-lg">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-[var(--slate)] truncate">{entry.name}</span>
                          <span className="font-bold text-[var(--navy)] ml-auto font-mono">
                             {((entry.value / totalExpenses) * 100).toFixed(0)}%
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Monthly Trend (Bar) */}
              <div className="statement-card p-5 sm:p-6 h-[400px] sm:h-[500px] flex flex-col">
                 <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                       <h3 className="text-sm sm:text-base font-semibold text-[var(--navy)] uppercase tracking-wider">Monthly Spending Trend</h3>
                       <p className="text-[10px] sm:text-xs text-[var(--slate-light)] mt-0.5">Historical spending timeline</p>
                    </div>
                 </div>

                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barData} margin={{ top: 10, right: 5, left: 5, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
                          <XAxis 
                             dataKey="month" 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: 'var(--slate-light)', fontSize: 10 }}
                             dy={10}
                          />
                          <YAxis 
                             axisLine={false}
                             tickLine={false}
                             tick={{ fill: 'var(--slate-light)', fontSize: 10 }}
                             tickFormatter={(value) => `₹${value}`}
                             width={50}
                          />
                          <Tooltip 
                             cursor={{ fill: 'var(--slate-faint)', opacity: 0.3 }}
                             contentStyle={tooltipStyle}
                             formatter={(value) => [`₹${value.toFixed(2)}`, 'Outlay']}
                             labelStyle={{ color: 'var(--slate-light)', marginBottom: '0.5rem' }}
                          />
                          <Bar 
                             dataKey="amount" 
                             fill="var(--emerald)"
                             radius={[6, 6, 0, 0]}
                             barSize={28}
                          />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>

            {/* Daily Spending Line Chart (when a specific month is selected) */}
            {selectedMonth !== 'all' && lineData.length > 1 && (
              <div className="statement-card p-5 sm:p-6 h-[300px] sm:h-[350px] flex flex-col">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--navy)] uppercase tracking-wider">Daily Spending — {selectedMonth}</h3>
                  <p className="text-[10px] sm:text-xs text-[var(--slate-light)] mt-0.5">Day-by-day expense distribution</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--slate-light)', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--slate-light)', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} width={50} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toFixed(2)}`, 'Spent']} />
                      <Line type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category Breakdown Table */}
            <div className="statement-card p-5 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--navy)] uppercase tracking-wider">Category Details</h3>
                <p className="text-[10px] sm:text-xs text-[var(--slate-light)] mt-0.5">Detailed breakdown with amounts and percentages</p>
              </div>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--hairline)]">
                      <th className="text-left py-2.5 px-2 sm:px-3 text-[10px] uppercase tracking-wider text-[var(--slate-light)] font-semibold font-mono">Category</th>
                      <th className="text-right py-2.5 px-2 sm:px-3 text-[10px] uppercase tracking-wider text-[var(--slate-light)] font-semibold font-mono">Amount</th>
                      <th className="text-right py-2.5 px-2 sm:px-3 text-[10px] uppercase tracking-wider text-[var(--slate-light)] font-semibold font-mono">Share</th>
                      <th className="text-right py-2.5 px-2 sm:px-3 text-[10px] uppercase tracking-wider text-[var(--slate-light)] font-semibold font-mono hidden sm:table-cell">Txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieData.map((entry, index) => {
                      const txCount = filteredTransactions.filter(t => t.type === 'expense' && t.category === entry.name).length;
                      return (
                        <tr key={entry.name} className="border-b border-[var(--hairline)] hover:bg-[var(--canvas)] transition-colors">
                          <td className="py-2.5 px-2 sm:px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-[var(--navy)] font-medium truncate max-w-[120px] sm:max-w-none">{entry.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-2 sm:px-3 font-mono text-[var(--navy)] font-semibold tabular-nums">
                            ₹{entry.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-2.5 px-2 sm:px-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 sm:w-16 h-1.5 bg-[var(--slate-faint)] rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full rounded-full" style={{ width: `${(entry.value / totalExpenses) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                              </div>
                              <span className="font-mono text-[var(--slate)] tabular-nums">{((entry.value / totalExpenses) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-2 sm:px-3 font-mono text-[var(--slate-light)] hidden sm:table-cell">{txCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--navy)]">
                      <td className="py-3 px-2 sm:px-3 font-semibold text-[var(--navy)] uppercase text-[10px] tracking-wider">Total</td>
                      <td className="text-right py-3 px-2 sm:px-3 font-mono font-bold text-[var(--navy)] tabular-nums">
                        ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right py-3 px-2 sm:px-3 font-mono font-bold text-[var(--navy)]">100%</td>
                      <td className="text-right py-3 px-2 sm:px-3 font-mono text-[var(--slate-light)] hidden sm:table-cell">
                        {filteredTransactions.filter(t => t.type === 'expense').length}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Chatbot */}
      <AiChatbot
        mode="floating"
        suggestions={[
          'What are my top spending categories?',
          'How can I reduce food expenses?',
          'Show me my spending trend',
        ]}
      />
    </div>
  );
}
