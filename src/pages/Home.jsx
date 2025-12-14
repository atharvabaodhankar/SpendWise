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
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const { currentUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dashboardRef = useRef(null);
  const bgRef1 = useRef(null);
  const bgRef2 = useRef(null);
  const bgRef3 = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // Cinematic Dashboard Tilt Effect
      if (dashboardRef.current) {
        // Calculate rotation based on scroll. 
        // Starts at 20deg, decreases as we scroll down to 0, then goes negative (tilts forward) slightly.
        const rotationX = Math.max(-5, 20 - (scrollY * 0.08)); 
        const navY = Math.min(100, scrollY * 0.2); // Moves down slightly for parallax
        const scale = Math.min(1.05, 1 + (scrollY * 0.0005));
        
        dashboardRef.current.style.transform = `
          perspective(1200px) 
          rotateX(${rotationX}deg) 
          translateY(${navY}px) 
          scale(${scale})
        `;
      }

      // Parallax Background Effects
      if (bgRef1.current) {
        bgRef1.current.style.transform = `translateY(${scrollY * 0.5}px) rotate(${scrollY * 0.1}deg)`;
      }
      if (bgRef2.current) {
        bgRef2.current.style.transform = `translateY(${scrollY * 0.3}px) rotate(${-scrollY * 0.1}deg)`;
      }
      if (bgRef3.current) {
        bgRef3.current.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-blue-500 selection:text-white font-sans text-slate-900">
      {/* Fluid Animated Background - Fixed */}
      <div className="fixed inset-0 z-0 animate-aurora pointer-events-none" />
      
      {/* Organic Floating Blobs - Fixed & Parallaxed */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
        <div ref={bgRef1} className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-400/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div ref={bgRef2} className="absolute top-[40%] left-[-20%] w-[600px] h-[600px] bg-purple-400/30 rounded-full blur-[120px] mix-blend-multiply" />
        <div ref={bgRef3} className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-emerald-300/30 rounded-full blur-[120px] mix-blend-multiply" />
      </div>

      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/70 backdrop-blur-xl border-b border-white/40 py-4 shadow-sm' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SpendWise Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                SpendWise
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Pricing</a>
              <div className="flex items-center gap-4 pl-4 border-l border-slate-300/50">
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-blue-600 transition-colors font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4 space-y-4 shadow-xl z-50">
            <a href="#features" className="block text-slate-600 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <hr className="border-slate-100" />
            <Link to="/login" className="block text-slate-600 hover:text-blue-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link to="/signup" className="block w-full py-3 text-center bg-slate-900 text-white rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 text-center perspective-container">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm mb-8 animate-fade-scale">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600">Reimagined for 2025</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight animate-slide-up drop-shadow-sm">
          Master Your Money <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Build Your Future
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium" style={{ animationDelay: '0.1s' }}>
          Stop wondering where your money went. Take control with powerful insights, intuitive tracking, and smart budgeting tools.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 group"
          >
            Start for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-slate-800 border border-white rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 shadow-md hover:shadow-lg backdrop-blur-sm"
          >
            Log In
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="hidden md:block mt-20 relative mx-auto max-w-5xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div 
             ref={dashboardRef}
             className="relative rounded-3xl bg-white/40 p-3 ring-1 ring-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-transform duration-100 ease-out origin-top border border-white/50"
             style={{ transform: 'perspective(1200px) rotateX(20deg)' }}
          >
            <div className="relative bg-slate-50/90 rounded-2xl overflow-hidden border border-white/60 aspect-[16/9] flex items-center justify-center shadow-inner">
              {/* Abstract UI Representation */}
              <div className="grid grid-cols-12 gap-6 p-8 w-full h-full opacity-90 transition-opacity">
                {/* Sidebar */}
                <div className="col-span-3 space-y-4 border-r border-slate-200/50 pr-6">
                  <div className="h-8 w-32 bg-slate-200/80 rounded-lg" />
                  <div className="h-4 w-24 bg-slate-200/50 rounded delay-75" />
                  <div className="space-y-3 mt-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-full bg-slate-100/80 rounded-xl" />
                    ))}
                  </div>
                </div>
                {/* Main Content */}
                <div className="col-span-9 space-y-6">
                  <div className="flex justify-between">
                    <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
                    <div className="flex gap-2">
                       <div className="h-8 w-8 bg-slate-200/80 rounded-full" />
                       <div className="h-8 w-8 bg-slate-200/80 rounded-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="h-32 bg-white/80 rounded-2xl border border-slate-100/50 shadow-sm" />
                    ))}
                  </div>
                  <div className="h-64 bg-white/80 rounded-2xl border border-slate-100/50 shadow-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-50/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-8 pb-8 h-40 gap-4">
                      {[40, 60, 45, 70, 50, 80, 65, 90, 75, 55].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className="w-full bg-blue-100 rounded-t-sm" />
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reflection/Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none rounded-3xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative z-10">
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
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl border border-white/10">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
              Ready to transform your finances?
            </h2>
            <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto relative z-10">
              Join thousands of users who have already taken control of their financial future with SpendWise.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:-translate-y-1 shadow-lg relative z-10"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-lg border-t border-white/60 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">SpendWise</span>
              </div>
              <p className="text-slate-600 text-sm">
                Empowering you to make smarter financial decisions every day.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
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
    <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/50 hover:border-white/80 hover:shadow-xl hover:bg-white/60 transition-all duration-300 group shadow-sm">
      <div className="mb-6 p-4 rounded-2xl bg-white/60 w-fit group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
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
