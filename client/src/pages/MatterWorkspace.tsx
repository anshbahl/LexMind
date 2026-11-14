import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Sidebar as SidebarIcon,
  Maximize2,
  Sparkles,
  Columns,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { Case, Hearing, CaseDocument } from '../types';
import { MatterDossierPane } from '../components/dossier/MatterDossierPane';
import { TipTapLegalEditor } from '../components/editor/TipTapLegalEditor';
import { LexMindCoCounselPane } from '../components/co-counsel/LexMindCoCounselPane';
import { DocumentSlideOver } from '../components/common/DocumentSlideOver';
import { ChamberBriefModal } from '../components/common/ChamberBriefModal';
import { CNRBadge } from '../components/common/CNRBadge';
import { CaseTypeBadge } from '../components/common/CaseTypeBadge';

export const MatterWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pane visibility toggles for lawyer focus
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  // Editor and Co-Counsel bridge state
  const [selectedEditorText, setSelectedEditorText] = useState<string>('');
  const [suggestedClause, setSuggestedClause] = useState<string | null>(null);

  // Slide-over Document / Precedent Viewer
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);

  // 2-Minute Chamber Brief state
  const [chamberBrief, setChamberBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  const loadCaseData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.cases.get(id);
      setCaseData(res.case);
      setHearings(res.hearings);
      setDocuments(res.documents);
    } catch (err: any) {
      console.error('Failed to load case data:', err);
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [id]);

  const handleOpenDocument = (docId: string, chunkId?: string) => {
    setActiveDocumentId(docId);
    setActiveChunkId(chunkId || null);
  };

  const handleGenerateBrief = async () => {
    if (!id) return;
    setLoadingBrief(true);
    setChamberBrief(null);
    try {
      const res = await api.cases.getChamberBrief(id);
      setChamberBrief(res.brief);
    } catch (err: any) {
      alert(`Failed to generate Chamber Brief: ${err.message}`);
    } finally {
      setLoadingBrief(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-gold-500" />
          <p className="text-xs font-semibold text-navy-900 tracking-wider uppercase font-sans">
            Opening Matter Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-charcoal-200 text-center shadow-card">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-navy-900 text-lg mb-2">Matter Not Found</h3>
          <p className="text-xs text-charcoal-500 mb-4">{error || 'Unable to access requested case file.'}</p>
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 rounded-md bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800"
          >
            Back to Matters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-canvas">
      {/* Workspace Sub-header */}
      <div className="h-11 bg-white border-b border-charcoal-200 px-4 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/cases"
            className="text-charcoal-500 hover:text-navy-900 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Matters</span>
          </Link>

          <span className="text-charcoal-300">/</span>

          <CaseTypeBadge type={caseData.case_type} />

          <h2 className="font-serif font-bold text-navy-900 text-xs sm:text-sm truncate max-w-xs sm:max-w-md">
            {caseData.case_title}
          </h2>

          <CNRBadge cnr={caseData.cnr_number} className="hidden md:inline-flex" />
        </div>

        {/* View Controls & Chamber Brief Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateBrief}
            className="px-2.5 py-1 rounded bg-gold-50 hover:bg-gold-100 text-gold-700 border border-gold-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            title="Generate 2-Minute Chamber Brief for court appearance"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>2-Min Brief</span>
          </button>

          <div className="h-4 w-px bg-charcoal-200 mx-1" />

          {/* Pane toggles */}
          <button
            onClick={() => setShowLeftPane(!showLeftPane)}
            className={`p-1.5 rounded transition-colors ${
              showLeftPane ? 'bg-charcoal-100 text-navy-900' : 'text-charcoal-400 hover:text-navy-900'
            }`}
            title={showLeftPane ? 'Hide Matter Dossier' : 'Show Matter Dossier'}
          >
            {showLeftPane ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRightPane(!showRightPane)}
            className={`p-1.5 rounded transition-colors ${
              showRightPane ? 'bg-charcoal-100 text-navy-900' : 'text-charcoal-400 hover:text-navy-900'
            }`}
            title={showRightPane ? 'Hide Co-Counsel Panel' : 'Show Co-Counsel Panel'}
          >
            {showRightPane ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3-Pane Signature Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1: Left Pane (Matter Dossier) */}
        {showLeftPane && (
          <div className="w-[23%] min-w-[280px] max-w-sm h-full flex flex-col border-r border-charcoal-200/80 transition-all">
            <MatterDossierPane
              caseData={caseData}
              hearings={hearings}
              documents={documents}
              onRefreshCase={loadCaseData}
              onOpenDocument={(docId) => handleOpenDocument(docId)}
              onGenerateBrief={handleGenerateBrief}
            />
          </div>
        )}

        {/* PANE 2: Center Pane (Drafting Canvas with TipTap) */}
        <div className="flex-1 h-full flex flex-col min-w-[360px] overflow-hidden">
          <TipTapLegalEditor
            caseData={caseData}
            suggestedClause={suggestedClause}
            onAcceptSuggestedClause={() => setSuggestedClause(null)}
            onRejectSuggestedClause={() => setSuggestedClause(null)}
            onSelectionChange={(selected) => setSelectedEditorText(selected)}
          />
        </div>

        {/* PANE 3: Right Pane (LexMind Co-Counsel) */}
        {showRightPane && (
          <div className="w-[30%] min-w-[320px] max-w-md h-full flex flex-col border-l border-charcoal-200/80 transition-all">
            <LexMindCoCounselPane
              caseData={caseData}
              selectedEditorText={selectedEditorText}
              onSendClauseToEditor={(clause) => setSuggestedClause(clause)}
              onOpenDocument={(docId, chunkId) => handleOpenDocument(docId, chunkId)}
            />
          </div>
        )}
      </div>

      {/* Slide-over Document / Precedent Viewer */}
      <DocumentSlideOver
        documentId={activeDocumentId}
        highlightChunkId={activeChunkId}
        onClose={() => {
          setActiveDocumentId(null);
          setActiveChunkId(null);
        }}
      />

      {/* 2-Minute Chamber Brief Modal */}
      <ChamberBriefModal
        brief={chamberBrief}
        loading={loadingBrief}
        onClose={() => setChamberBrief(null)}
      />
    </div>
  );
};
