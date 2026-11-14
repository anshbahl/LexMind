import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Search, ShieldCheck, User, LogOut, Bell, Sparkles } from 'lucide-react';
import { Lawyer } from '../../types';
import { clearAuthToken } from '../../services/api';

interface NavbarProps {
  lawyer: Lawyer | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lawyer, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-navy-900 border-b border-navy-800 text-white px-4 flex items-center justify-between z-30 shrink-0">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center group-hover:bg-gold-500 group-hover:text-navy-950 transition-all">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base tracking-tight text-white">LexMind</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-navy-800 text-gold-400 rounded border border-navy-700">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-charcoal-400 tracking-wider uppercase font-sans">
              Indian Legal Practice & Precedent AI
            </p>
          </div>
        </Link>
      </div>

      {/* Global Precedent Search Quick Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div
          onClick={() => navigate('/precedents')}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-950/60 border border-navy-700/80 hover:border-gold-500/50 text-charcoal-400 text-xs cursor-pointer transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-gold-400" />
          <span className="flex-1 text-charcoal-400">Search chamber pleadings, citations (e.g. S. 138 NI Act, O. 39)...</span>
          <kbd className="font-mono text-[10px] bg-navy-800 px-1.5 py-0.5 rounded text-charcoal-300">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Advocate Profile & Status */}
      <div className="flex items-center gap-4">
        {/* Guardrail badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-charcoal-300 bg-navy-950/80 px-2.5 py-1 rounded-full border border-navy-700">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
          <span>Strict Precedent Grounding</span>
        </div>

        {lawyer ? (
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-navy-800 text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gold-500 text-navy-950 font-semibold flex items-center justify-center text-xs shadow-sm">
                {lawyer.full_name.replace('Adv. ', '').charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-white truncate max-w-[140px]">
                  {lawyer.full_name}
                </div>
                <div className="text-[10px] font-mono text-gold-400">
                  {lawyer.bar_council_id || 'Advocate'}
                </div>
              </div>
            </Link>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-navy-800 text-charcoal-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 rounded bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold text-xs transition-colors"
          >
            Advocate Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
