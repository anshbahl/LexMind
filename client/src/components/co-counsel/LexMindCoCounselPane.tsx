import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Send,
  Search,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Scale,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Case, RetrievedPrecedent } from '../../types';
import { api, streamLegalDraft } from '../../services/api';
import { PrecedentCard } from '../common/PrecedentCard';

interface LexMindCoCounselPaneProps {
  caseData: Case;
  selectedEditorText?: string;
  onSendClauseToEditor: (clause: string) => void;
  onOpenDocument: (documentId: string, chunkId?: string) => void;
}

export const LexMindCoCounselPane: React.FC<LexMindCoCounselPaneProps> = ({
  caseData,
  selectedEditorText,
  onSendClauseToEditor,
  onOpenDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'precedents'>('draft');

  // Drafting assistant state
  const [draftingIntent, setDraftingIntent] = useState('');
  const [useSelectedText, setUseSelectedText] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedOutput, setStreamedOutput] = useState('');
  const [highestSimilarity, setHighestSimilarity] = useState<number | null>(null);
  const [citedPrecedents, setCitedPrecedents] = useState<any[]>([]);
  const [isBelowThreshold, setIsBelowThreshold] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Precedent search state
  const [searchQuery, setSearchQuery] = useState('');
  const [precedentResults, setPrecedentResults] = useState<RetrievedPrecedent[]>([]);
  const [searching, setSearching] = useState(false);

  // Set initial intent presets depending on case type
  useEffect(() => {
    if (caseData.case_type === 'CRIMINAL') {
      setDraftingIntent('Draft grounds for anticipatory bail under Section 438 CrPC / 482 BNSS highlighting non-custodial necessity and Arnesh Kumar precedent');
    } else if (caseData.case_type === 'COMMERCIAL') {
      setDraftingIntent('Draft application grounds under Order 39 Rules 1 & 2 CPC for interim injunction and preservation of status quo');
    } else if (caseData.case_type === 'WRIT') {
      setDraftingIntent('Draft grounds of challenge under Article 226 for violation of natural justice and arbitrary administrative action');
    } else {
      setDraftingIntent('Draft concise pleading grounds grounded in past chamber precedent');
    }

    // Automatically load initial relevant chamber precedents for this case
    handleSearchPrecedents(caseData.case_title);
  }, [caseData]);

  const handleSearchPrecedents = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSearching(true);
    try {
      const res = await api.precedents.search({
        query: queryText,
        case_type: caseData.case_type,
        limit: 8,
      });
      setPrecedentResults(res.precedents);
    } catch (err: any) {
      console.error('Error searching precedents:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleStartDrafting = async () => {
    if (!draftingIntent.trim() || isGenerating) return;

    setIsGenerating(true);
    setStreamedOutput('');
    setCitedPrecedents([]);
    setHighestSimilarity(null);
    setIsBelowThreshold(false);

    await streamLegalDraft(
      {
        case_id: caseData.id,
        drafting_intent: draftingIntent,
        selected_text: useSelectedText && selectedEditorText ? selectedEditorText : undefined,
      },
      {
        onMeta: (meta) => {
          setHighestSimilarity(meta.highestSimilarity);
          setIsBelowThreshold(meta.isBelowThreshold);
          setCitedPrecedents(meta.precedents || []);
        },
        onToken: (token) => {
          setStreamedOutput((prev) => prev + token);
        },
        onDone: () => {
          setIsGenerating(false);
        },
        onError: (err) => {
          setIsGenerating(false);
          alert(`Drafting error: ${err}`);
        },
      }
    );
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(streamedOutput);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Render clickable source citations found in text
  const renderGroundedOutput = (text: string) => {
    // Matches patterns like [Source: FileName, §Section]
    const parts = text.split(/(\[Source:\s*[^\]]+\])/g);

    return parts.map((part, idx) => {
      if (part.startsWith('[Source:')) {
        const cleanLabel = part.slice(8, -1).trim();
        // Look up matched precedent
        const matched = citedPrecedents.find(
          (p) => part.includes(p.file_name) || part.includes(p.case_title)
        );

        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (matched) {
                onOpenDocument(matched.document_id, matched.chunk_id);
              } else if (citedPrecedents[0]) {
                onOpenDocument(citedPrecedents[0].document_id);
              }
            }}
            className="citation-pill mx-1 my-0.5 inline-flex items-center gap-1 align-baseline hover:scale-105"
            title="Grounded in your authenticated chamber file. Click to inspect source document."
          >
            <BookOpen className="w-3 h-3 text-gold-600" />
            <span>{cleanLabel}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-canvas border-l border-charcoal-200 overflow-hidden">
      {/* 1. Header with Tab Switcher */}
      <div className="p-3 border-b border-charcoal-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-navy-900 text-gold-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-navy-900 text-sm tracking-tight">LexMind Co-Counsel</h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            Strict Grounding Active
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-0.5 rounded-lg bg-charcoal-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('draft')}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === 'draft' ? 'bg-white text-navy-900 font-semibold shadow-sm' : 'text-charcoal-500 hover:text-navy-900'
            }`}
          >
            Drafting Assistant
          </button>
          <button
            onClick={() => setActiveTab('precedents')}
            className={`py-1.5 rounded-md transition-all ${
              activeTab === 'precedents' ? 'bg-white text-navy-900 font-semibold shadow-sm' : 'text-charcoal-500 hover:text-navy-900'
            }`}
          >
            Chamber Precedents ({precedentResults.length})
          </button>
        </div>
      </div>

      {/* 2. Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'draft' ? (
          <div className="space-y-4">
            {/* Prompt Formulation Input */}
            <div className="bg-white rounded-lg border border-charcoal-200 p-3 shadow-card space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-600">
                Drafting Objective / Clause Intent
              </label>

              <textarea
                rows={3}
                value={draftingIntent}
                onChange={(e) => setDraftingIntent(e.target.value)}
                placeholder="e.g. Draft grounds for interim stay citing balance of convenience..."
                className="w-full text-xs font-sans p-2.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none"
              />

              {/* Context Selector */}
              {selectedEditorText && (
                <label className="flex items-start gap-2 text-xs text-charcoal-600 cursor-pointer bg-gold-50/50 p-2 rounded border border-gold-200">
                  <input
                    type="checkbox"
                    checked={useSelectedText}
                    onChange={(e) => setUseSelectedText(e.target.checked)}
                    className="mt-0.5 text-navy-900 rounded"
                  />
                  <div>
                    <span className="font-semibold text-navy-900">Include text selected in editor</span>
                    <p className="text-[11px] text-charcoal-500 line-clamp-1 italic mt-0.5">
                      "{selectedEditorText}"
                    </p>
                  </div>
                </label>
              )}

              {/* Quick Intent Pills */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                  Quick Prompts:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() =>
                      setDraftingIntent('Draft grounds for anticipatory bail under S. 438 CrPC / 482 BNSS based on non-custodial necessity')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-charcoal-100 hover:bg-gold-100 text-charcoal-700 hover:text-navy-900 transition-colors"
                  >
                    Anticipatory Bail Grounds
                  </button>
                  <button
                    onClick={() =>
                      setDraftingIntent('Draft cause of action paragraphs for S. 138 Negotiable Instruments Act dishonoured cheque complaint')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-charcoal-100 hover:bg-gold-100 text-charcoal-700 hover:text-navy-900 transition-colors"
                  >
                    138 NI Act Cause of Action
                  </button>
                  <button
                    onClick={() =>
                      setDraftingIntent('Draft interim stay application under Order 39 Rules 1 & 2 CPC establishing prima facie case and irreparable injury')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-charcoal-100 hover:bg-gold-100 text-charcoal-700 hover:text-navy-900 transition-colors"
                  >
                    Order 39 Interim Injunction
                  </button>
                  <button
                    onClick={() =>
                      setDraftingIntent('Draft Writ Grounds under Article 226 challenging arbitrary administrative order for breach of natural justice')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-charcoal-100 hover:bg-gold-100 text-charcoal-700 hover:text-navy-900 transition-colors"
                  >
                    Art. 226 Writ Grounds
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleStartDrafting}
                disabled={isGenerating || !draftingIntent.trim()}
                className="w-full py-2 px-3 rounded bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                    <span>Retrieving Chamber Precedents & Drafting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-gold-400" />
                    <span>Draft Like Me (Style Grounded)</span>
                  </>
                )}
              </button>
            </div>

            {/* Below-Threshold Fallback Notification Banner */}
            {isBelowThreshold && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-xs">Chamber Archive Fallback Triggered</h5>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Highest precedent similarity ({Math.round((highestSimilarity || 0) * 100)}%) is
                    below the 70% confidence threshold. Drafting strictly uses general Indian legal principles without fabricating internal chamber citations.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Stream Output Card */}
            {streamedOutput && (
              <div className="bg-white rounded-lg border border-charcoal-200 shadow-card p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-charcoal-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold-500" />
                    <h4 className="font-semibold text-xs text-navy-900">Grounded Draft Output</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyDraft}
                      className="p-1 rounded text-charcoal-500 hover:text-navy-900 hover:bg-charcoal-100 text-xs"
                      title="Copy clause"
                    >
                      {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onSendClauseToEditor(streamedOutput)}
                      className="px-2.5 py-1 rounded bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs inline-flex items-center gap-1 transition-colors"
                      title="Transfer to Editor with Diff Review"
                    >
                      <span>To Editor</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Grounded Text with Clickable Citation Pills */}
                <div className="font-serif text-xs leading-relaxed text-charcoal-800 whitespace-pre-wrap select-text max-h-[420px] overflow-y-auto p-1">
                  {renderGroundedOutput(streamedOutput)}
                </div>

                {/* Grounded Sources Footer */}
                {citedPrecedents.length > 0 && !isBelowThreshold && (
                  <div className="pt-2.5 border-t border-charcoal-100">
                    <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block mb-1">
                      Cited Grounding Sources:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {citedPrecedents.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => onOpenDocument(p.document_id, p.chunk_id)}
                          className="citation-pill text-[10px]"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{p.file_name}</span>
                          <span className="opacity-60">({Math.round(p.similarity * 100)}%)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Semantic Precedent Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search past pleadings, citations, orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchPrecedents(e.target.value);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Results List */}
            {searching ? (
              <div className="py-12 text-center text-charcoal-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                <p>Running Hybrid Cosine + tsvector BM25 Search...</p>
              </div>
            ) : precedentResults.length === 0 ? (
              <div className="py-12 text-center text-charcoal-400 text-xs">
                <Scale className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                <p>No matching precedents found in chamber archive.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {precedentResults.map((p) => (
                  <PrecedentCard
                    key={p.chunk_id}
                    precedent={p}
                    onInspect={(docId, chunkId) => onOpenDocument(docId, chunkId)}
                    onInsert={(text) => onSendClauseToEditor(text)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Guardrail Guarantee Footer */}
      <div className="p-2.5 px-3 border-t border-charcoal-200 bg-white text-[10px] text-charcoal-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-navy-950 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-gold-500" />
          <span>Strict Guardrail: Zero Outcome Prediction Score</span>
        </div>
        <span className="font-mono text-charcoal-400">pgvector cosine ops</span>
      </div>
    </div>
  );
};
