import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CNRBadgeProps {
  cnr?: string | null;
  className?: string;
}

export const CNRBadge: React.FC<CNRBadgeProps> = ({ cnr, className = '' }) => {
  const [copied, setCopied] = useState(false);

  if (!cnr) {
    return <span className="text-xs text-charcoal-400 italic">No CNR Assigned</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy CNR Number"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 border border-charcoal-200 cursor-pointer transition-colors group ${className}`}
    >
      <span className="text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider">CNR:</span>
      <span className="font-mono text-xs font-medium text-navy-900 tracking-tight">{cnr}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 text-charcoal-400 group-hover:text-charcoal-600" />
      )}
    </div>
  );
};
