import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Search, User, LogOut } from 'lucide-react';
import { Lawyer } from '../../types';

interface NavbarProps {
  lawyer: Lawyer | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lawyer, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-navy-900 border-b border-navy-800 text-white px-5 flex items-center justify-between z-30 shrink-0">
      {/* Brand Logo & Chamber Title */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-md bg-gold-500/15 border border-gold-500/30 text-gold-400 flex items-center justify-center group-hover:bg-gold-500 group-hover:text-navy-950 transition-all">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base tracking-tight text-white">LexMind</span>
              <span className="text-[11px] text-charcoal-400 font-sans tracking-wide">
                | Legal Practice & Drafting
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Global Precedent Search Quick Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div
          onClick={() => navigate('/precedents')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-navy-950/50 border border-navy-800 hover:border-gold-500/40 text-charcoal-400 text-xs cursor-pointer transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-gold-400" />
          <span className="flex-1 text-charcoal-400 truncate">
            Search chamber files & precedents...
          </span>
          <kbd className="font-mono text-[10px] bg-navy-800 px-1.5 py-0.5 rounded text-charcoal-400">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Advocate Profile & Actions */}
      <div className="flex items-center gap-4">
        {lawyer ? (
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-2.5 py-1 rounded-md hover:bg-navy-800 text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 font-semibold flex items-center justify-center text-xs">
                {lawyer.full_name.replace('Adv. ', '').charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-white truncate max-w-[150px]">
                  {lawyer.full_name}
                </div>
                <div className="text-[10px] text-charcoal-400">
                  {lawyer.bar_council_id ? `Bar No. ${lawyer.bar_council_id}` : 'Advocate'}
                </div>
              </div>
            </Link>

            <div className="h-4 w-px bg-navy-800" />

            <button
              onClick={onLogout}
              className="p-1.5 rounded hover:bg-navy-800 text-charcoal-400 hover:text-white transition-colors"
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
