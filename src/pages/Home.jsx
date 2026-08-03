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
  Mail,
  CreditCard,
  Search,
  Menu,
  ChevronRight
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
      description: 'Seamlessly track cash and digital wallets in one unified view for complete financial clarity.',
      color: 'primary'
    },
    {
      icon: Users,
      title: 'Social Expense Splitting',
      description: 'Split bills instantly with friends. detailed debt tracking ensures everyone settles up fairly.',
      color: 'accent'
    },
    {
      icon: PieChart,
      title: 'Intelligent Analytics',
      description: ' Visualize your spending habits with stunning, interactive charts and personalized insights.',
      color: 'success'
    },
    {
      icon: Mail,
      title: 'Smart Alerts',
      description: 'Get notified about low balances, large transactions, and monthly budget limits via email.',
      color: 'warning'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Your financial data is encrypted and protected with enterprise-level security protocols.',
      color: 'danger'
    },
    {
      icon: Zap,
      title: 'Real-time Sync',
      description: 'Experience instant updates across all your devices. Your financial state is always current.',
      color: 'primary'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden selection:bg-[var(--accent-500)] selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[var(--canvas)]/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-[1120px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--navy)] rounded-md flex items-center justify-center font-mono text-base font-medium text-white shadow-md">
              S
            </div>
            <span className="text-base font-semibold tracking-wider text-[var(--navy)] uppercase">
              SpendWise
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="btn-statement text-[10px]"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="btn-statement-primary text-[10px]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 max-w-[1120px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text Content */}
          <div className="lg:w-1/2 text-left">
            <div className="stamp-pill mb-6">
              SpendWise Passbook Edition
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight text-[var(--navy)] mb-6 leading-[1.15]">
              Personal Expense Tracking, <br />
              <span className="text-[var(--slate-light)]">Redefined as a Statement.</span>
            </h1>
            
            <p className="text-base text-[var(--slate)] mb-8 leading-relaxed">
              Track daily outlays, split bills with friends, and monitor your monthly budget ruler with a clean, high-precision expense tracker layout.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-statement-primary text-[11px] py-3.5 px-6 flex items-center gap-2"
              >
                Start Your Ledger
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-statement text-[11px] py-3.5 px-6"
              >
                Sign In To Account
              </button>
            </div>
          </div>

          {/* Statement Preview Card */}
          <div className="lg:w-1/2 w-full">
            <div className="passbook-card p-8 border border-[var(--hairline)] shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--hairline)] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--navy)] rounded-md flex items-center justify-center font-mono text-sm text-white">S</div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[var(--navy)]">SpendWise Statement</div>
                    <div className="text-[10px] font-mono text-[var(--slate-light)]">JULY 2026 PASSBOOK</div>
                  </div>
                </div>
                <span className="stamp-pill text-[9px] py-1 px-3">Live Ledger</span>
              </div>

              <div className="mb-6">
                <div className="text-[10px] uppercase tracking-[2px] text-[var(--slate-light)] font-semibold mb-1">Cumulative Outlay</div>
                <div className="font-mono text-4xl font-semibold text-[var(--navy)] tabular-nums">₹63,962.67</div>
              </div>

              <div className="space-y-3">
                <div className="ledger-row py-2">
                  <div className="font-mono text-[10px] text-[var(--slate-light)] w-12">25 MAY</div>
                  <div className="text-xs font-semibold text-[var(--navy)]">Anjeer and jamun</div>
                  <div className="flex-1 border-b border-dashed border-[var(--hairline)]"></div>
                  <div className="font-mono text-xs font-semibold text-[var(--rose)] tabular-nums">−₹110.00</div>
                </div>
                <div className="ledger-row py-2">
                  <div className="font-mono text-[10px] text-[var(--slate-light)] w-12">25 MAY</div>
                  <div className="text-xs font-semibold text-[var(--navy)]">Vadapaav and bhaje</div>
                  <div className="flex-1 border-b border-dashed border-[var(--hairline)]"></div>
                  <div className="font-mono text-xs font-semibold text-[var(--rose)] tabular-nums">−₹60.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-[1120px] mx-auto px-6 border-t border-[var(--hairline)]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-[10px] tracking-[2px] text-[var(--slate-light)] uppercase font-semibold mb-2">High-Precision Tools</div>
          <h2 className="text-3xl md:text-5xl font-semibold text-[var(--navy)] mb-4 tracking-tight">
            Empowering Features for Modern Finances
          </h2>
          <p className="text-sm text-[var(--slate)] max-w-xl mx-auto">
            Built with precision and care, SpendWise provides expense tracker tools, debt splitting, and AI intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="statement-card p-6 flex flex-col justify-between hover:border-[var(--navy)] transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-[var(--navy)] text-white flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--navy)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-[var(--slate)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--navy)] text-white relative overflow-hidden my-12">
        <div className="max-w-[1120px] mx-auto px-6 relative z-10 text-center">
          <div className="text-[10px] tracking-[2px] text-[var(--emerald)] uppercase font-mono font-semibold mb-3">Instant Setup</div>
          <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-sm text-[var(--slate-light)] mb-8 max-w-xl mx-auto">
            Join thousands of smart spenders who have taken control of their financial outlays with SpendWise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/signup')}
              className="btn-statement-primary text-[11px] py-3.5 px-8 bg-white text-[var(--navy)] border-white hover:bg-[var(--canvas)]"
            >
              Get Started Now
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="btn-statement text-[11px] py-3.5 px-8 text-white border-white/20 bg-transparent hover:bg-white/10"
            >
              Sign In To Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--hairline)] py-12">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[var(--navy)] rounded-md flex items-center justify-center font-mono text-xs text-white">
                S
              </div>
              <span className="text-sm font-semibold tracking-wider text-[var(--navy)] uppercase">SpendWise</span>
            </div>
            
            <div className="flex gap-6 text-xs text-[var(--slate)] font-medium">
              <a href="#features" className="hover:text-[var(--navy)] transition-colors">Features</a>
              <a href="/login" className="hover:text-[var(--navy)] transition-colors">Sign In</a>
              <a href="/signup" className="hover:text-[var(--navy)] transition-colors">Register</a>
            </div>

            <p className="text-xs text-[var(--slate-light)] font-mono">
              © 2026 SpendWise Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
