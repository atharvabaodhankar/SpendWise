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

  // Process data for charts
  const expensesByCategory = transactions
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
              >
                ← Dashboard
              </a>
              <span className="hidden sm:block text-gray-700 text-sm">
                {currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-red-700 transition-colors duration-200 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-500 text-lg font-medium">No data to analyze yet</p>
            <p className="text-gray-400 mt-2">Add some transactions to see your spending patterns!</p>
            <a 
              href="/dashboard" 
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Add Transactions
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Expenses by Category */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 flex items-center">
                <span className="mr-2">🥧</span>
                <span className="truncate">Expenses by Category</span>
              </h2>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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
            </div>

            {/* Monthly Spending */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 flex items-center">
                <span className="mr-2">📈</span>
                <span className="truncate">Monthly Spending</span>
              </h2>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg shadow-md xl:col-span-2 border border-blue-100">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 flex items-center">
                <span className="mr-2">📊</span>
                <span className="truncate">Spending Summary</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    ₹{Object.values(expensesByCategory).reduce((a, b) => a + b, 0).toFixed(2)}
                  </div>
                  <p className="text-gray-600 font-medium">Total Expenses</p>
                </div>
                <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {Object.keys(expensesByCategory).length}
                  </div>
                  <p className="text-gray-600 font-medium">Categories</p>
                </div>
                <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ₹{Object.values(expensesByCategory).length > 0 
                      ? (Object.values(expensesByCategory).reduce((a, b) => a + b, 0) / Object.values(expensesByCategory).length).toFixed(2)
                      : '0.00'
                    }
                  </div>
                  <p className="text-gray-600 font-medium">Avg per Category</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}