import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, Loader2, User, Check } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-[var(--card-bg)] border-r border-[var(--card-border)] relative z-10">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <img src="/logo.png" alt="SpendWise Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--success-500)] transition-colors">SpendWise</span>
        </Link>
        
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Start your journey to financial freedom today.
            </p>
          </div>

          <div className="mt-8">
            <div className="space-y-6">
               <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[var(--card-border)] rounded-xl shadow-sm text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--success-500)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </button>
                </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--card-border)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--card-bg)] text-[var(--text-tertiary)]">Or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-[var(--danger-50)] border border-[var(--danger-200)] rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--danger-500)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--danger-700)]">{error}</p>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-premium pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-premium pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheckIcon className="h-5 w-5 text-[var(--text-tertiary)]" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-premium pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="text-xs text-[var(--text-tertiary)]">
                  By clicking "Create Account", you agree to our <a href="#" className="underline hover:text-[var(--success-500)]">Terms</a> and <a href="#" className="underline hover:text-[var(--success-500)]">Privacy Policy</a>.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center items-center py-3 bg-[var(--success-500)] hover:bg-[var(--success-600)]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--success-500)] hover:text-[var(--success-600)] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Side - Decorative */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden bg-[var(--bg-secondary)]">
        <div className="absolute inset-0 h-full w-full">
           <div className="absolute inset-0 bg-gradient-to-bl from-[var(--primary-900)] to-[var(--bg-secondary)] w-full h-full" />
           {/* Abstract shapes */}
           <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[600px] h-[600px] rounded-full bg-[var(--success-500)]/10 blur-3xl animate-pulse" />
           <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[600px] h-[600px] rounded-full bg-[var(--accent-500)]/10 blur-3xl animate-pulse delay-700" />
           
           <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-[var(--text-primary)] z-10">
             <div className="max-w-xl text-center space-y-12">
               <div className="grid grid-cols-2 gap-6">
                 <div className="p-6 bg-[var(--primary-800)]/40 backdrop-blur-md rounded-2xl border border-[var(--primary-700)] transform hover:-translate-y-1 transition-transform">
                   <div className="w-10 h-10 bg-[var(--success-500)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--success-500)]">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                     </svg>
                   </div>
                   <h3 className="font-bold mb-1 text-[#f8fafc]">Track Growth</h3>
                   <p className="text-xs text-[var(--text-tertiary)]">Watch your savings grow with real-time analytics.</p>
                 </div>
                 <div className="p-6 bg-[var(--primary-800)]/40 backdrop-blur-md rounded-2xl border border-[var(--primary-700)] transform hover:-translate-y-1 transition-transform delay-100">
                   <div className="w-10 h-10 bg-[var(--accent-500)]/20 rounded-lg flex items-center justify-center mb-4 text-[var(--accent-500)]">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="font-bold mb-1 text-[#f8fafc]">Stay Secure</h3>
                   <p className="text-xs text-[var(--text-tertiary)]">Bank-level encryption keeps your data safe.</p>
                 </div>
               </div>
               
               <div>
                  <h3 className="text-3xl font-bold mb-4 text-[#f8fafc]">Join the Revolution</h3>
                  <p className="text-[var(--text-tertiary)] text-lg">Stop stressing about finances and start living your life. We'll handle the numbers.</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// Icon component needed for signup explicitly
function ShieldCheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
