import React from 'react';
import { CaseType } from '../../types';

interface CaseTypeBadgeProps {
  type: CaseType;
  className?: string;
}

export const CaseTypeBadge: React.FC<CaseTypeBadgeProps> = ({ type, className = '' }) => {
  const styles: Record<CaseType, { bg: string; text: string; border: string }> = {
    CRIMINAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    COMMERCIAL: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    WRIT: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    CIVIL: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    ARBITRATION: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    FAMILY: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  };

  const style = styles[type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {type}
    </span>
  );
};

