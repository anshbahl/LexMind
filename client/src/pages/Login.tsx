import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Lawyer } from '../types';

interface LoginProps {
  onLoginSuccess: (lawyer: Lawyer) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('vikramaditya.sen@delhibar.in');
  const [password, setPassword] = useState('advocate123');
  const [fullName, setFullName] = useState('Adv. Vikramaditya Sen');
  const [barCouncilId, setBarCouncilId] = useState('D/1429/2011');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.auth.register({
          full_name: fullName,
          email,
          password,
          bar_council_id: barCouncilId || undefined,
        });
        onLoginSuccess(res.lawyer);
        navigate('/');
      } else {
        const res = await api.auth.login(email, password);
        onLoginSuccess(res.lawyer);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setIsRegister(false);
    setEmail('vikramaditya.sen@delhibar.in');
    setPassword('advocate123');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 flex items-center justify-center mx-auto shadow-md mb-3">
          <Scale className="w-7 h-7" />
        </div>
        <h2 className="font-serif font-bold text-3xl text-navy-900 tracking-tight">LexMind</h2>
        <p className="mt-1 text-xs text-charcoal-500 tracking-wider uppercase font-sans">
          AI Legal Practice Management & Precedent Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-editor rounded-xl border border-charcoal-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Advocate Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adv. Vikramaditya Sen"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                    />
                    <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Bar Council ID</label>
                  <input
                    type="text"
                    value={barCouncilId}
                    onChange={(e) => setBarCouncilId(e.target.value)}
                    placeholder="e.g. D/1429/2011"
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Bar / Chamber Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="advocate@delhibar.in"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Register Chamber Profile' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-5 pt-4 border-t border-charcoal-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-700 border border-gold-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Use Seeded Advocate Account (Vikramaditya Sen)</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-charcoal-600 hover:text-navy-900 font-medium"
            >
              {isRegister
                ? 'Already have an advocate profile? Sign In'
                : "New to LexMind? Register Advocate Profile"}
            </button>
          </div>
        </div>

        {/* Guardrail guarantee footnote */}
        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-xs text-charcoal-500">
          <ShieldCheck className="w-4 h-4 text-gold-600" />
          <span>Strict Guardrails: No Win/Loss Predictions • 100% Isolated Vector Store</span>
        </div>
      </div>
    </div>
  );
};
