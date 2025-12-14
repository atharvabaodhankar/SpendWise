import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  PieChart, 
  Target, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Menu,
  X 
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { currentUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                SpendWise
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
              <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Testimonials</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Pricing</a>
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 text-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl z-50 animate-slide-down">
            <a href="#features" className="block text-slate-600 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <hr className="border-slate-100" />
            <Link to="/login" className="block text-slate-600 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/signup" className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-scale">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600">New: Smart AI Budgeting</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight animate-slide-up">
          Master Your Money <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Build Your Future
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Stop wondering where your money went. Take control with powerful insights, intuitive tracking, and smart budgeting tools designed for modern life.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 flex items-center justify-center gap-2 group"
          >
            Start for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-lg transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            Log In
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative mx-auto max-w-5xl perspective-1000 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative rounded-2xl bg-white p-2 ring-1 ring-slate-900/5 shadow-2xl backdrop-blur-sm transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
            <div className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] flex items-center justify-center">
              {/* Abstract UI Representation */}
              <div className="grid grid-cols-12 gap-6 p-8 w-full h-full opacity-90 hover:opacity-100 transition-opacity">
                <div className="col-span-3 space-y-4 border-r border-slate-200 pr-6">
                  <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-4 w-24 bg-slate-200/50 rounded animate-pulse delay-75" />
                  <div className="space-y-2 mt-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-full bg-slate-100 rounded-lg" />
                    ))}
                  </div>
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="flex justify-between">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="flex gap-2">
                       <div className="h-8 w-8 bg-slate-200 rounded-full" />
                       <div className="h-8 w-8 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="h-32 bg-white rounded-xl border border-slate-100 shadow-sm" />
                    ))}
                  </div>
                  <div className="h-64 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-8 pb-8 h-40 gap-4">
                      {[40, 60, 45, 70, 50, 80, 65, 90, 75, 55].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-100 rounded-t-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">
              Everything you need to <span className="text-blue-600">grow your wealth</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Powerful tools to help you track, plan, and optimize your financial life without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
              title="Expense Tracking"
              description="Monitor every dollar with intuitive categorization and real-time updates."
            />
            <FeatureCard 
              icon={<PieChart className="w-8 h-8 text-purple-600" />}
              title="Smart Analytics"
              description="Visualize your spending habits with beautiful, interactive charts and graphs."
            />
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-emerald-600" />}
              title="Budget Goals"
              description="Set custom budgets for different categories and get notified when you're close to limits."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-indigo-600" />}
              title="Bank-Grade Security"
              description="Your data is encrypted and secure. We prioritize your privacy above all else."
            />
             <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-pink-600" />}
              title="Financial Insights"
              description="Get personalized recommendations to improve your financial health score."
            />
             <FeatureCard 
              icon={<CheckCircle2 className="w-8 h-8 text-teal-600" />}
              title="Easy Imports"
              description="Seamlessly import transactions or simpler yet, add them manually in seconds."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
              Ready to transform your finances?
            </h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto relative z-10">
              Join thousands of users who have already taken control of their financial future with SpendWise.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:-translate-y-1 shadow-lg relative z-10"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">SpendWise</span>
              </div>
              <p className="text-slate-500 text-sm">
                Empowering you to make smarter financial decisions every day.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} SpendWise. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group shadow-sm">
      <div className="mb-6 p-4 rounded-xl bg-blue-50 w-fit group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
        <div className="group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
        {description}
      </p>
    </div>
  );
}
