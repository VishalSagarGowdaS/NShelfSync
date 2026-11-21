import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setEmail('customer@shelfsync.com');
      setPassword('Customer@123');
    } else {
      setEmail('admin@shelfsync.com');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            SS
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to ShelfSync</h1>
          <p className="text-xs text-slate-500">Access your orders, saved addresses & synchronized cart</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fill Quick Buttons for CSE Examiner */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block">
            Demo Evaluation Credentials:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo('customer')}
              className="flex-1 py-1.5 px-2.5 bg-white border border-slate-300 hover:border-blue-600 hover:text-blue-600 rounded-xl font-semibold text-[11px] transition shadow-sm flex items-center justify-center space-x-1"
            >
              <User className="w-3 h-3 text-blue-600" />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 py-1.5 px-2.5 bg-white border border-slate-300 hover:border-purple-600 hover:text-purple-600 rounded-xl font-semibold text-[11px] transition shadow-sm flex items-center justify-center space-x-1"
            >
              <Shield className="w-3 h-3 text-purple-600" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@shelfsync.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline text-[11px]">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};
