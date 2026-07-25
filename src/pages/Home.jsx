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
              Track daily outlays, split bills with friends, and monitor your monthly budget ruler with a clean, high-precision passbook layout.
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
      <section id="features" className="py-24 bg-[var(--bg-secondary)] relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-6">
              Empowering Features for <br/> 
              <span className="text-[var(--primary-500)]">Modern Finances</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Built with precision and care, SpendWise gives you the tools you need to succeed in today's digital economy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-3xl bg-[var(--bg-primary)] border border-[var(--card-border)] hover:border-[var(--accent-500)]/30 shadow-lg hover:shadow-[var(--accent-500)]/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-[var(--${feature.color}-50)] dark:bg-[var(--${feature.color}-900)]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 text-[var(--${feature.color}-600)] dark:text-[var(--${feature.color}-400)]`} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--primary-900)] dark:bg-[var(--bg-secondary)]">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xl text-[var(--primary-200)] mb-10 max-w-2xl mx-auto">
            Join thousands of smart spenders who have already taken control of their financial destiny.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
               onClick={() => navigate('/signup')}
               className="px-8 py-4 bg-white text-[var(--primary-900)] rounded-2xl font-bold text-lg hover:bg-[var(--primary-50)] transition-colors shadow-2xl"
             >
               Get Started Now
             </button>
             <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-transparent border border-[var(--primary-700)] text-white rounded-2xl font-bold text-lg hover:bg-[var(--primary-800)]/50 transition-colors"
             >
               Sign In
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--bg-primary)] border-t border-[var(--card-border)] py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--primary-900)] p-2 rounded-lg text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">SpendWise</span>
            </div>
            
            <div className="flex gap-8 text-[var(--text-secondary)] text-sm font-medium">
              <a href="#" className="hover:text-[var(--accent-600)] transition-colors">Features</a>
              <a href="#" className="hover:text-[var(--accent-600)] transition-colors">Pricing</a>
              <a href="#" className="hover:text-[var(--accent-600)] transition-colors">About</a>
              <a href="#" className="hover:text-[var(--accent-600)] transition-colors">Contact</a>
            </div>

            <p className="text-[var(--text-tertiary)] text-sm">
              © 2026 SpendWise Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
