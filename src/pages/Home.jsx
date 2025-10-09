import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-gray-900">SpendWise</h1>
          <div className="space-x-4">
            <Link
              to="/login"
              className="text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="text-center py-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Take Control of Your Finances
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track your income and expenses, set budgets, and visualize your spending patterns 
            with our easy-to-use budget tracking app.
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Track Expenses</h3>
            <p className="text-gray-600">
              Easily categorize and monitor your daily expenses to understand where your money goes.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Set Budgets</h3>
            <p className="text-gray-600">
              Create monthly budgets and get alerts when you're approaching your limits.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Visualize Trends</h3>
            <p className="text-gray-600">
              See your spending patterns with beautiful charts and gain insights into your habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}