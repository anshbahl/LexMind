import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Daily Practice Desk', icon: LayoutDashboard },
    { to: '/cases', label: 'Matters & Case Files', icon: Briefcase },
    { to: '/precedents', label: 'Chamber Precedents', icon: Search },
    { to: '/settings', label: 'Drafting Style & Profile', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-navy-950 text-charcoal-300 border-r border-navy-800/80 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 pt-4 space-y-4">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-800 text-gold-400 font-semibold'
                    : 'text-charcoal-400 hover:text-white hover:bg-navy-900/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Subtle Confidentiality & Isolation Notice */}
      <div className="p-4 border-t border-navy-900 text-charcoal-400 flex items-center gap-2 text-[11px]">
        <ShieldCheck className="w-4 h-4 text-gold-500/80 shrink-0" />
        <span className="leading-tight">Private Chamber Vault • Delhi Bar</span>
      </div>
    </aside>
  );
};
