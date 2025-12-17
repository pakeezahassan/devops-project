import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Star } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'buyer' | 'vendor'>('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName, role);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-600 p-10 text-white">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">MarketHub</h2>
              <p className="text-blue-100">Shop and sell across multiple vendors with secure checkout.</p>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Star size={18} className="mt-1" />
                <div>
                  <div className="font-semibold">Trusted vendors</div>
                  <div className="text-sm text-blue-100">Verified stores and transparent pricing</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Star size={18} className="mt-1" />
                <div>
                  <div className="font-semibold">Fast checkout</div>
                  <div className="text-sm text-blue-100">Simple, secure, and reliable payments</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Star size={18} className="mt-1" />
                <div>
                  <div className="font-semibold">Realtime orders</div>
                  <div className="text-sm text-blue-100">Track your orders as they progress</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-600">
            {isSignUp ? 'Join our marketplace today' : 'Sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I want to
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value="buyer"
                      checked={role === 'buyer'}
                      onChange={(e) => setRole(e.target.value as 'buyer')}
                      className="peer sr-only"
                    />
                    <div className="p-4 border-2 border-slate-300 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 transition text-center">
                      <div className="font-medium">Shop</div>
                      <div className="text-xs text-slate-600">Buy products</div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value="vendor"
                      checked={role === 'vendor'}
                      onChange={(e) => setRole(e.target.value as 'vendor')}
                      className="peer sr-only"
                    />
                    <div className="p-4 border-2 border-slate-300 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 transition text-center">
                      <div className="font-medium">Sell</div>
                      <div className="text-xs text-slate-600">Open a store</div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
                type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your password"
            />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <a className="text-sm text-blue-600 hover:text-blue-700" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Loading...'
            ) : isSignUp ? (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium transition"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
