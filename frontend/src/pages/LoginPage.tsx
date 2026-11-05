import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mic, Lock, Mail, ArrowRight, AlertCircle, ShieldAlert, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = () => {
    setEmail('john@example.com');
    setPassword('User@123');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@voicemart.com');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-200">
            <Mic className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back to VoiceMart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your cart, order history, and voice preferences.
          </p>
        </div>

        {/* Demo Fast-Fill Pill for Evaluators */}
        <div className="mb-6 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs space-y-2">
          <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
            Quick Demo Accounts (Evaluation):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillDemoUser}
              className="flex-1 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl font-medium text-indigo-700 transition-colors shadow-2xs text-[11px]"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="flex-1 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-xl font-medium text-indigo-700 transition-colors shadow-2xs text-[11px] flex items-center justify-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" /> Admin
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or admin"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 active:scale-[0.99]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
};

