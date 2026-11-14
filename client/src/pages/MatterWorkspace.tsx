import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Case, Hearing, CaseDocument } from '../types';
import { MatterDossierPane } from '../components/dossier/MatterDossierPane';
import { TipTapLegalEditor } from '../components/editor/TipTapLegalEditor';
import { LexMindCoCounselPane } from '../components/co-counsel/LexMindCoCounselPane';
import { DocumentSlideOver } from '../components/common/DocumentSlideOver';
import { ChamberBriefModal } from '../components/common/ChamberBriefModal';

export const MatterWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <p className="text-sm font-medium text-navy-900">Loading Matter Dossier & Knowledge Store...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-xl border border-charcoal-200 text-center shadow-card">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-navy-900 text-lg mb-2">Matter Not Found</h3>
          <p className="text-xs text-charcoal-500 mb-4">{error || 'Unable to access requested case file.'}</p>
          <button
            onClick={() => navigate('/cases')}
            className="px-4 py-2 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800"
          >
            Back to Matters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-canvas">
      {/* 3-Pane Signature Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1: Left Pane (22% width — Matter Dossier) */}
        <div className="w-[22%] min-w-[280px] h-full flex flex-col">
          <MatterDossierPane
            caseData={caseData}
            hearings={hearings}
            documents={documents}
            onRefreshCase={loadCaseData}
            onOpenDocument={(docId) => handleOpenDocument(docId)}
            onGenerateBrief={handleGenerateBrief}
          />
        </div>

        {/* PANE 2: Center Pane (48% width — Drafting Canvas with TipTap) */}
        <div className="w-[48%] h-full flex flex-col border-r border-charcoal-200">
          <TipTapLegalEditor
            caseData={caseData}
            suggestedClause={suggestedClause}
            onAcceptSuggestedClause={() => setSuggestedClause(null)}
            onRejectSuggestedClause={() => setSuggestedClause(null)}
            onSelectionChange={(selected) => setSelectedEditorText(selected)}
          />
        </div>

        {/* PANE 3: Right Pane (30% width — LexMind Co-Counsel) */}
        <div className="w-[30%] min-w-[320px] h-full flex flex-col">
          <LexMindCoCounselPane
            caseData={caseData}
            selectedEditorText={selectedEditorText}
            onSendClauseToEditor={(clause) => setSuggestedClause(clause)}
            onOpenDocument={(docId, chunkId) => handleOpenDocument(docId, chunkId)}
          />
        </div>
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
