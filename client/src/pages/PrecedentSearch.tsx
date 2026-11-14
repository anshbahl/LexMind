import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { RetrievedPrecedent, CaseType } from '../types';
import { PrecedentCard } from '../components/common/PrecedentCard';
import { DocumentSlideOver } from '../components/common/DocumentSlideOver';

export const PrecedentSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('anticipatory bail 438 crpc custodial interrogation arnesh kumar');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('ALL');
  const [results, setResults] = useState<RetrievedPrecedent[]>([]);
  const [loading, setLoading] = useState(false);

  // Slide-over inspection
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.precedents.search({
        query: query.trim(),
        case_type: caseTypeFilter !== 'ALL' ? (caseTypeFilter as CaseType) : undefined,
        limit: 12,
      });
      setResults(res.precedents);
    } catch (err: any) {
      console.error('Error in precedent search:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [caseTypeFilter]);

  const quickQueries = [
    'Section 438 Anticipatory Bail non-custodial necessity',
    'Section 138 NI Act cheque dishonour statutory demand notice',
    'Order 39 Rule 1 and 2 interim injunction balance of convenience',
    'Article 226 Writ Petition arbitrary transfer breach of natural justice',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-charcoal-200/80 p-6 shadow-card space-y-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-navy-900">
            Chamber Precedent Archive
          </h1>
          <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
            Search across your past petitions, bail applications, commercial agreements, and court orders.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search legal doctrines, sections, or factual matrix (e.g., S. 138 NI Act, Order 39, Article 226)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-md border border-charcoal-300 text-sm focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-2.5 rounded-md bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-medium text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-gold-400" /> : <Sparkles className="w-4 h-4 text-gold-400" />}
              <span>Search Archive</span>
            </button>
          </div>

          {/* Quick Query Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-charcoal-400 font-medium">Common Searches:</span>
            {quickQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(q);
                  handleSearch(q);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-canvas hover:bg-gold-50 text-charcoal-700 hover:text-navy-900 border border-charcoal-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-charcoal-500 font-medium">Jurisdiction:</span>
        {['ALL', 'CRIMINAL', 'COMMERCIAL', 'WRIT', 'CIVIL'].map((t) => (
          <button
            key={t}
            onClick={() => setCaseTypeFilter(t)}
            className={`px-3 py-1 rounded-md transition-all ${
              caseTypeFilter === t
                ? 'bg-navy-900 text-white font-semibold'
                : 'bg-white text-charcoal-600 hover:bg-charcoal-100 border border-charcoal-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy-900 text-base">
            Relevant Precedents ({results.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-charcoal-400">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-gold-500" />
            <p className="text-xs font-medium text-navy-900">Retrieving matching chamber precedents...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-charcoal-400 bg-white rounded-lg border border-charcoal-200">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
            <h4 className="text-sm font-semibold text-navy-900">No matching precedents located</h4>
            <p className="text-xs text-charcoal-500 mt-1">Try broadening your search query or uploading more case files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => (
              <PrecedentCard
                key={p.chunk_id}
                precedent={p}
                onInspect={(docId, chunkId) => {
                  setActiveDocId(docId);
                  setActiveChunkId(chunkId);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Document / Precedent Viewer */}
      <DocumentSlideOver
        documentId={activeDocId}
        highlightChunkId={activeChunkId}
        onClose={() => {
          setActiveDocId(null);
          setActiveChunkId(null);
        }}
      />
    </div>
  );
};
