import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Users,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Bell,
  Zap,
  Mail
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Wallet,
      title: 'Dual Balance Tracking',
      description: 'Track both cash and online balances separately for complete financial clarity.',
      color: 'primary'
    },
    {
      icon: Users,
      title: 'Bill Splitting',
      description: 'Split expenses with friends, track debts, and settle up effortlessly.',
      color: 'accent'
    },
    {
      icon: PieChart,
      title: 'Smart Analytics',
      description: 'Beautiful charts and insights to understand your spending patterns.',
      color: 'success'
    },
    {
      icon: Mail,
      title: 'Email Alerts',
      description: 'Get notified about low balances, split bills, and daily expense limits.',
      color: 'warning'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is protected with Firebase Authentication and Firestore.',
      color: 'danger'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'See changes instantly across all your devices with live synchronization.',
      color: 'primary'
    }
  ];

  const benefits = [
    'Track unlimited transactions',
    'Set monthly budgets',
    'Manage friend expenses',
    'Export to PDF & Excel',
    'Historical transaction support',
    'Mobile responsive design'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-96 h-96 bg-[var(--primary-200)]/20 rounded-full blur-3xl -top-20 -left-20"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          ></div>
          <div 
            className="absolute w-96 h-96 bg-[var(--accent-200)]/20 rounded-full blur-3xl top-40 -right-20"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          ></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] bg-clip-text text-transparent">
                SpendWise
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Your Personal Finance Manager
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-6 animate-slide-up">
              Take Control of Your
              <span className="bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] bg-clip-text text-transparent block mt-2">
                Spending Journey
              </span>
            </h1>
            
            <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Track expenses, split bills with friends, and get smart insights—all in one beautiful app.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] text-white font-semibold shadow-2xl hover:shadow-[var(--primary-300)] hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-tertiary)] transition-all"
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--primary-600)]">100%</div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">Free</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent-600)]">∞</div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--success-600)]">Real-time</div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">Sync</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-[var(--bg-primary)]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Powerful features designed to make managing your finances simple and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="premium-card p-6 hover:scale-105 transition-transform cursor-default group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-[var(--${feature.color}-100)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-[var(--${feature.color}-600)]`} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-br from-[var(--primary-50)] to-[var(--accent-50)]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                Why Choose SpendWise?
              </h2>
              <p className="text-lg text-[var(--text-secondary)]">
                Join thousands of users managing their finances smarter.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-[var(--card-border)] animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--success-100)] flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[var(--success-600)]" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Take Control?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start tracking your expenses, splitting bills, and achieving your financial goals today.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-4 rounded-xl bg-white text-[var(--primary-700)] font-bold shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 bg-[var(--bg-primary)] border-t border-[var(--card-border)]">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">SpendWise</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            © 2026 SpendWise. Built with ❤️ for better financial management.
          </p>
        </div>
      </footer>
    </div>
  );
}
