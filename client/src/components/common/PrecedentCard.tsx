import React from 'react';
import { ExternalLink, Copy, Check, Scale } from 'lucide-react';
import { RetrievedPrecedent } from '../../types';
import { CaseTypeBadge } from './CaseTypeBadge';

interface PrecedentCardProps {
  precedent: RetrievedPrecedent;
  onInspect: (documentId: string, chunkId: string) => void;
  onInsert?: (text: string) => void;
}

export const PrecedentCard: React.FC<PrecedentCardProps> = ({
  precedent,
  onInspect,
  onInsert,
}) => {
  const [copied, setCopied] = React.useState(false);
  const similarityPct = Math.round(precedent.semantic_similarity * 100);

  const getRelevanceLabel = () => {
    if (similarityPct >= 65) return 'Strong Precedent';
    if (similarityPct >= 35) return 'Relevant Clause';
    return 'Chamber Reference';
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(precedent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-charcoal-200/80 p-4 hover:border-gold-400 hover:shadow-sm transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-bold text-navy-900 text-sm truncate group-hover:text-gold-600 transition-colors">
              {precedent.case_title}
            </h4>
            <p className="text-xs text-charcoal-500 truncate mt-0.5">{precedent.court_forum}</p>
          </div>

          <div className="shrink-0">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-700">
              {getRelevanceLabel()}
            </span>
          </div>
        </div>

        {/* Section info */}
        <div className="flex items-center gap-2 mb-2 text-xs text-charcoal-500">
          <CaseTypeBadge type={precedent.case_type} />
          <span>•</span>
          <span className="font-medium text-navy-800">§ {precedent.section_type}</span>
          {precedent.file_name && (
            <>
              <span>•</span>
              <span className="truncate max-w-[140px] text-charcoal-400">{precedent.file_name}</span>
            </>
          )}
        </div>

        {/* Snippet text */}
        <p className="font-serif text-xs text-charcoal-700 line-clamp-3 leading-relaxed bg-canvas/60 p-2.5 rounded border border-charcoal-100 mb-3 select-text">
          {precedent.content}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-charcoal-100 text-xs">
        <button
          onClick={() => onInspect(precedent.document_id, precedent.chunk_id)}
          className="text-navy-900 hover:text-gold-600 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Inspect Source Doc</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-charcoal-400 hover:text-charcoal-800 p-1 rounded hover:bg-charcoal-100 transition-colors"
            title="Copy snippet"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onInsert && (
            <button
              onClick={() => onInsert(precedent.content)}
              className="px-2.5 py-1 text-xs font-medium rounded bg-navy-900 hover:bg-navy-800 text-white transition-colors"
            >
              Insert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
