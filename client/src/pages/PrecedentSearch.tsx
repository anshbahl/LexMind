import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  Scale,
  RefreshCw,
  BookOpen,
  Building,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { RetrievedPrecedent, CaseType } from '../types';
import { PrecedentCard } from '../components/common/PrecedentCard';
import { DocumentSlideOver } from '../components/common/DocumentSlideOver';

export const PrecedentSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('anticipatory bail 438 crpc custodial interrogation arnesh kumar');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('ALL');
  const [courtForumFilter, setCourtForumFilter] = useState('');
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
        court_forum: courtForumFilter.trim() || undefined,
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
    'Section 438 CrPC Anticipatory Bail non-custodial interrogation',
    'Section 138 NI Act statutory notice dishonour cheque presumption',
    'Order 39 Rule 1 and 2 CPC interim injunction balance of convenience',
    'Article 226 Writ Petition arbitrary transfer breach of natural justice',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-charcoal-200 p-6 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">
            Hybrid Precedent Intelligence
          </span>
          <span className="text-charcoal-300">•</span>
          <span className="text-xs text-charcoal-500 font-mono">
            Cosine Similarity + tsvector BM25 RRF
          </span>
        </div>
        <h1 className="font-serif font-bold text-2xl text-navy-900">
          Chamber Precedent Archive & Knowledge Store
        </h1>
        <p className="text-xs text-charcoal-500 mt-1 max-w-3xl leading-relaxed">
          Search across your own historical pleadings, petitions, bail applications, and court orders.
          LexMind ranks clauses by semantic relevance and exact Indian statutory citations, strictly isolated to your chamber.
        </p>

        {/* Search Input Bar */}
        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search legal doctrines, sections, or factual matrix (e.g., S. 138 NI Act, Order 39, Article 226)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-charcoal-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 bg-canvas/40"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-gold-400" /> : <Sparkles className="w-4 h-4 text-gold-400" />}
              <span>Search Archive</span>
            </button>
          </div>

          {/* Quick Query Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider">
              Sample Inquiries:
            </span>
            {quickQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(q);
                  handleSearch(q);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-charcoal-100 hover:bg-gold-50 hover:text-gold-700 text-charcoal-700 border border-charcoal-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-charcoal-200 shadow-card text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-charcoal-600">Filter By Jurisdiction:</span>
          {['ALL', 'CRIMINAL', 'COMMERCIAL', 'WRIT', 'CIVIL'].map((t) => (
            <button
              key={t}
              onClick={() => setCaseTypeFilter(t)}
              className={`px-3 py-1 rounded-md transition-all ${
                caseTypeFilter === t
                  ? 'bg-navy-900 text-white font-semibold'
                  : 'bg-canvas text-charcoal-600 hover:bg-charcoal-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-charcoal-500 font-medium">Strict Tenant-Isolated Search</span>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-navy-900 text-base">
            Ranked Precedent Matches ({results.length})
          </h3>
          <span className="text-xs text-charcoal-500 font-mono">
            Reciprocal Rank Fusion (RRF) Scored
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-charcoal-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-gold-500" />
            <p className="text-sm font-medium text-navy-900">Querying PostgreSQL pgvector index...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-charcoal-400 bg-white rounded-xl border border-charcoal-200">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-charcoal-300" />
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
