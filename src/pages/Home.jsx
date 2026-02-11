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
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--primary-200)] dark:border-[var(--primary-800)]' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-[var(--primary-700)] to-[var(--accent-600)] p-2 rounded-xl text-white shadow-lg shadow-[var(--accent-500)]/20">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
              SpendWise
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="hidden md:block px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-[var(--primary-900)] dark:bg-[var(--accent-600)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-[var(--accent-400)]/10 rounded-full blur-[120px] mix-blend-multiply dark:bg-[var(--accent-900)]/20 animate-pulse" />
          <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-[var(--primary-400)]/10 rounded-full blur-[100px] mix-blend-multiply dark:bg-[var(--primary-900)]/20" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Text Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-50)] dark:bg-[var(--accent-900)]/30 border border-[var(--accent-100)] dark:border-[var(--accent-800)] text-[var(--accent-700)] dark:text-[var(--accent-300)] text-sm font-medium mb-8 animate-slide-up">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Reimagine your financial future</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-[var(--text-primary)] mb-8 leading-[1.1] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Master Your Money <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-600)] via-[var(--primary-600)] to-[var(--accent-600)] animate-gradient-x">
                  With Confidence
                </span>
              </h1>
              
              <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Seamlessly track expenses, split bills with friends, and gain deep insights into your spending habits. The all-in-one financial companion you've been waiting for.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-4 bg-[var(--primary-900)] text-white rounded-2xl font-semibold shadow-xl shadow-[var(--primary-900)]/20 hover:shadow-2xl hover:shadow-[var(--primary-900)]/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 dark:bg-[var(--accent-600)] dark:shadow-[var(--accent-600)]/20"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm font-medium px-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[var(--bg-primary)] bg-[var(--primary-200)]" />
                    ))}
                  </div>
                  <span>Trusted by 10k+ users</span>
                </div>
              </div>
            </div>

            {/* 3D Dashboard Mockup */}
            <div className="lg:w-1/2 w-full perspective-1000 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div 
                className="relative w-full aspect-[4/3] bg-[var(--bg-secondary)] rounded-3xl shadow-2xl border border-[var(--primary-200)] dark:border-[var(--card-border)] overflow-hidden transform transition-all duration-700 hover:rotate-y-0 rotate-y-minus-6 hover:scale-105"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-10deg) rotateX(5deg)',
                  boxShadow: '20px 30px 60px rgba(0,0,0,0.1)'
                }}
              >
                {/* Mockup Top Bar */}
                <div className="h-14 border-b border-[var(--card-border)] flex items-center px-6 justify-between bg-[var(--bg-primary)]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <Bell className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-100)]" />
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="p-6 bg-[var(--bg-secondary)] h-full grid grid-cols-12 gap-6">
                  {/* Sidebar */}
                  <div className="col-span-1 hidden sm:flex flex-col gap-6 items-center pt-4">
                    <div className="p-2 bg-[var(--primary-900)] rounded-lg text-white"><TrendingUp className="w-5 h-5" /></div>
                    <div className="p-2 text-[var(--text-tertiary)]"><Users className="w-5 h-5" /></div>
                    <div className="p-2 text-[var(--text-tertiary)]"><PieChart className="w-5 h-5" /></div>
                  </div>

                  {/* Main */}
                  <div className="col-span-12 sm:col-span-11 space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)]">$12,450.00</h3>
                        <p className="text-[var(--text-secondary)] text-sm">Total Balance</p>
                      </div>
                      <div className="px-3 py-1 bg-[var(--success-100)] text-[var(--success-700)] rounded-full text-xs font-bold font-mono">+12.5%</div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-32 w-full bg-gradient-to-b from-[var(--accent-50)] to-transparent rounded-2xl border border-[var(--accent-100)] relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-between px-4 pb-0">
                         {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                           <div key={i} className="w-[10%] bg-[var(--accent-400)] rounded-t-sm opacity-60" style={{ height: `${h}%` }} />
                         ))}
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--card-border)]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {i === 1 ? <Users className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="w-24 h-4 bg-[var(--primary-100)] rounded mb-1" />
                              <div className="w-16 h-3 bg-[var(--primary-50)] rounded" />
                            </div>
                          </div>
                          <div className="w-16 h-4 bg-[var(--primary-200)] rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -right-6 top-20 p-4 bg-[var(--bg-primary)] rounded-2xl shadow-xl border border-[var(--card-border)] animate-bounce" style={{ animationDuration: '3s' }}>
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-100 rounded-lg text-green-600">
                       <TrendingUp className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="text-xs text-[var(--text-secondary)]">Saved this month</p>
                       <p className="font-bold text-sm text-[var(--text-primary)]">+$840.00</p>
                     </div>
                   </div>
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
