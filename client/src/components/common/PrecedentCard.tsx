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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(precedent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-charcoal-200 p-4 hover:border-gold-400 hover:shadow-card transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-navy-900 text-sm truncate group-hover:text-gold-600 transition-colors">
              {precedent.case_title}
            </h4>
            <p className="text-xs text-charcoal-500 truncate mt-0.5">{precedent.court_forum}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Similarity Score Pill in JetBrains Mono */}
            <span
              className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                similarityPct >= 70
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : similarityPct >= 40
                  ? 'bg-gold-50 text-gold-600 border-gold-200'
                  : 'bg-charcoal-50 text-charcoal-600 border-charcoal-200'
              }`}
              title="Semantic Vector Cosine Similarity"
            >
              {similarityPct}% Match
            </span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <CaseTypeBadge type={precedent.case_type} />
          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-navy-50 text-navy-800 border border-navy-100">
            § {precedent.section_type}
          </span>
          {precedent.file_name && (
            <span className="text-[11px] text-charcoal-400 truncate max-w-[150px]">
              {precedent.file_name}
            </span>
          )}
        </div>

        {/* Outcome Summary badge if available */}
        {precedent.outcome_summary && (
          <div className="mb-2.5 px-2 py-1 rounded bg-charcoal-50 border border-charcoal-200 text-[11px] text-charcoal-700 flex items-start gap-1.5">
            <Scale className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
            <span className="italic line-clamp-1">{precedent.outcome_summary}</span>
          </div>
        )}

        {/* Snippet text */}
        <p className="font-serif text-xs text-charcoal-700 line-clamp-4 leading-relaxed bg-canvas/60 p-2 rounded border border-charcoal-100 mb-3">
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
            className="text-charcoal-500 hover:text-charcoal-800 p-1 rounded hover:bg-charcoal-100 transition-colors"
            title="Copy snippet"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onInsert && (
            <button
              onClick={() => onInsert(precedent.content)}
              className="px-2 py-1 text-xs font-medium rounded bg-navy-900 hover:bg-navy-800 text-white transition-colors"
            >
              Insert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
