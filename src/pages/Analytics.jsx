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
    <div className="min-h-screen bg-[#0b1326] pb-20">
      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10 bg-[#0b1326]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo area */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="btn-secondary p-2 rounded-xl border-white/10 hover:border-white/20">
                 <ChevronLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>
                  Financial Analytics
                </h1>
                <p className="text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>
                  Category distributions & trend reports
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
               <div className="hidden md:block text-right mr-2">
                 <p className="text-xs font-semibold text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>LOGGED IN AS</p>
                 <p className="text-sm font-bold text-white">
                   {currentUser.email?.split('@')[0]}
                 </p>
               </div>
               <button
                 onClick={logout}
                 className="btn-danger p-2 rounded-xl text-white"
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
          <div className="glass-card text-center p-12 animate-slide-up flex flex-col items-center justify-center min-h-[400px] border border-white/10">
             <div className="w-24 h-24 mb-6 bg-[#6366f1]/15 border border-[#6366f1]/30 rounded-3xl flex items-center justify-center">
                <BarChart2 className="w-12 h-12 text-[#818cf8]" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Geist, sans-serif' }}>No data to analyze</h3>
             <p className="text-[#94a3b8] max-w-sm mb-8">
                Start adding expenses to generate intelligent visualizations and reports.
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
                  <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>Visual Overview</h2>
                  <p className="text-[#94a3b8] text-sm">Deep-dive into expense metrics</p>
               </div>
               
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                     <Filter className="w-4 h-4 text-[#94a3b8]" />
                  </div>
                  <select
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="input-premium pl-10 pr-10 py-2.5 min-w-[200px] bg-[#0b1326] text-white"
                  >
                     <option value="all" className="bg-[#0b1326] text-white">All Time</option>
                     {availableMonths.map(month => (
                        <option key={month} value={month} className="bg-[#0b1326] text-white">{month}</option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="glass-card p-6 flex items-center space-x-4 border border-white/10 hover:border-[#f43f5e]/30 transition-all">
                  <div className="p-4 rounded-2xl bg-[#f43f5e]/15 border border-[#f43f5e]/30 text-[#f43f5e]">
                     <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-xs font-semibold text-[#94a3b8] uppercase" style={{ fontFamily: 'Geist, sans-serif' }}>Total Outlays</p>
                     <h3 className="text-2xl font-extrabold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>
                        ₹{totalExpenses.toFixed(2)}
                     </h3>
                  </div>
               </div>
               
               <div className="glass-card p-6 flex items-center space-x-4 border border-white/10 hover:border-[#6366f1]/30 transition-all">
                  <div className="p-4 rounded-2xl bg-[#6366f1]/15 border border-[#6366f1]/30 text-[#818cf8]">
                     <PieIcon className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-xs font-semibold text-[#94a3b8] uppercase" style={{ fontFamily: 'Geist, sans-serif' }}>Active Categories</p>
                     <h3 className="text-2xl font-extrabold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>
                        {Object.keys(expensesByCategory).length}
                     </h3>
                  </div>
               </div>

               <div className="glass-card p-6 flex items-center space-x-4 border border-white/10 hover:border-[#10b981]/30 transition-all">
                  <div className="p-4 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981]">
                     <BarChart2 className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-xs font-semibold text-[#94a3b8] uppercase" style={{ fontFamily: 'Geist, sans-serif' }}>Avg. per Category</p>
                     <h3 className="text-2xl font-extrabold text-white mt-1" style={{ fontFamily: 'Geist, sans-serif' }}>
                        ₹{avgPerCategory.toFixed(2)}
                     </h3>
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
