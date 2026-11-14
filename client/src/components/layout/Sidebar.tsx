import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  BookOpen,
  Settings,
  Shield,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cases', label: 'Matters & Cases', icon: Briefcase },
    { to: '/precedents', label: 'Chamber Precedents', icon: Search },
    { to: '/settings', label: 'Drafting Style & Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-navy-950 text-charcoal-300 border-r border-navy-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-800 text-gold-400 font-semibold'
                    : 'text-charcoal-300 hover:text-white hover:bg-navy-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Tips / Guardrail Guarantee Card */}
        <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 space-y-2">
          <div className="flex items-center gap-1.5 text-gold-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Product Guardrail</span>
          </div>
          <p className="text-[11px] text-charcoal-400 leading-relaxed">
            LexMind never fabricates outcome probabilities or predictions. All precedent intelligence is
            grounded strictly in your authenticated chamber documents.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-navy-900 text-[10px] text-charcoal-500 flex flex-col gap-1">
        <span>PostgreSQL 16 + pgvector</span>
        <span>HNSW Index Cosine Ops</span>
        <span className="text-charcoal-600">LexMind Indian Legal OS v1.0</span>
      </div>
    </aside>
  );
};
