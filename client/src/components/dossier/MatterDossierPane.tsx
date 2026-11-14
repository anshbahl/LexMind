import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Upload,
  Plus,
  Sparkles,
  ChevronRight,
  Folder,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileCheck,
} from 'lucide-react';
import { Case, Hearing, CaseDocument, DocumentCategory } from '../../types';
import { CNRBadge } from '../common/CNRBadge';
import { CaseTypeBadge } from '../common/CaseTypeBadge';
import { api } from '../../services/api';

interface MatterDossierPaneProps {
  caseData: Case;
  hearings: Hearing[];
  documents: CaseDocument[];
  onRefreshCase: () => void;
  onOpenDocument: (documentId: string) => void;
  onGenerateBrief: () => void;
}

export const MatterDossierPane: React.FC<MatterDossierPaneProps> = ({
  caseData,
  hearings,
  documents,
  onRefreshCase,
  onOpenDocument,
  onGenerateBrief,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'files'>('timeline');
  const [showLogHearingModal, setShowLogHearingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Hearing log form state
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [judgeCoram, setJudgeCoram] = useState('');
  const [orderSummary, setOrderSummary] = useState('');
  const [nextActionItems, setNextActionItems] = useState('');
  const [nextDate, setNextDate] = useState('');

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<DocumentCategory>('PETITION');
  const [customName, setCustomName] = useState('');

  // Calculate days remaining to NDOH
  const getDaysRemaining = () => {
    if (!caseData.next_hearing_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hearing = new Date(caseData.next_hearing_date);
    hearing.setHours(0, 0, 0, 0);
    const diffTime = hearing.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  const handleLogHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose || !orderSummary) return;

    try {
      await api.hearings.create(caseData.id, {
        hearing_date: hearingDate,
        purpose,
        judge_coram: judgeCoram,
        order_summary: orderSummary,
        next_action_items: nextActionItems,
        next_hearing_date: nextDate || undefined,
      });
      setShowLogHearingModal(false);
      setPurpose('');
      setJudgeCoram('');
      setOrderSummary('');
      setNextActionItems('');
      setNextDate('');
      onRefreshCase();
    } catch (err: any) {
      alert(`Failed to log hearing: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('document_category', docCategory);
    if (customName) formData.append('custom_name', customName);

    try {
      await api.documents.upload(caseData.id, formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setCustomName('');
      onRefreshCase();
    } catch (err: any) {
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-canvas border-r border-charcoal-200 overflow-hidden">
      {/* 1. Case Header & Metadata */}
      <div className="p-4 border-b border-charcoal-200 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <CaseTypeBadge type={caseData.case_type} />
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
              caseData.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-charcoal-100 text-charcoal-700'
            }`}
          >
            {caseData.status}
          </span>
        </div>

        <h2 className="font-serif font-bold text-navy-900 text-base leading-snug line-clamp-2">
          {caseData.case_title}
        </h2>

        <p className="text-xs text-charcoal-500 font-medium mt-1 truncate">{caseData.court_forum}</p>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-charcoal-100">
          <CNRBadge cnr={caseData.cnr_number} />
          {caseData.next_hearing_date && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                daysRemaining !== null && daysRemaining <= 3
                  ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                  : 'bg-gold-50 text-gold-700 border border-gold-200'
              }`}
              title="Next Date of Hearing"
            >
              <Calendar className="w-3 h-3" />
              <span>
                {daysRemaining !== null && daysRemaining >= 0
                  ? `${daysRemaining}d to NDOH`
                  : 'NDOH Overdue'}
              </span>
            </span>
          )}
        </div>

        {/* 2-Min Chamber Brief Action Button */}
        <button
          onClick={onGenerateBrief}
          className="w-full mt-3.5 py-2 px-3 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all group"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400 group-hover:rotate-12 transition-transform" />
          <span>Generate 2-Min Chamber Brief</span>
        </button>
      </div>

      {/* 2. Dossier Tab Navigation */}
      <div className="flex border-b border-charcoal-200 bg-canvas text-xs font-medium">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-navy-900 text-navy-900 font-semibold bg-white'
              : 'border-transparent text-charcoal-500 hover:text-navy-900'
          }`}
        >
          Hearing Timeline ({hearings.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-navy-900 text-navy-900 font-semibold bg-white'
              : 'border-transparent text-charcoal-500 hover:text-navy-900'
          }`}
        >
          Case Files ({documents.length})
        </button>
      </div>

      {/* 3. Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'timeline' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider">
                Hearing Logs & Orders
              </span>
              <button
                onClick={() => setShowLogHearingModal(true)}
                className="text-xs font-semibold text-navy-900 hover:text-gold-600 inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Hearing</span>
              </button>
            </div>

            {hearings.length === 0 ? (
              <div className="py-12 text-center text-charcoal-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                <p>No hearings logged yet for this matter.</p>
                <button
                  onClick={() => setShowLogHearingModal(true)}
                  className="mt-2 text-gold-600 hover:underline font-medium"
                >
                  Record first hearing order
                </button>
              </div>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-charcoal-200">
                {hearings.map((h) => (
                  <div key={h.id} className="relative pl-6 group">
                    <div className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-navy-900 group-hover:scale-125 transition-transform" />
                    <div className="p-3 rounded-lg bg-white border border-charcoal-200 shadow-card hover:border-gold-300 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-navy-900 truncate">{h.purpose}</span>
                        <span className="font-mono text-[10px] text-charcoal-400">
                          {new Date(h.hearing_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      {h.judge_coram && (
                        <p className="text-[10px] text-charcoal-500 italic mb-1.5 truncate">
                          Coram: {h.judge_coram}
                        </p>
                      )}
                      <p className="font-serif text-xs text-charcoal-700 leading-relaxed line-clamp-3">
                        {h.order_summary}
                      </p>
                      {h.next_action_items && (
                        <div className="mt-2 text-[11px] bg-canvas p-1.5 rounded border border-charcoal-200 text-charcoal-600">
                          <span className="font-semibold text-navy-900">Next Action: </span>
                          {h.next_action_items}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider">
                Categorized Files
              </span>
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-semibold text-navy-900 hover:text-gold-600 inline-flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-12 text-center text-charcoal-400 text-xs">
                <Folder className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                <p>No pleadings or orders uploaded.</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2 text-gold-600 hover:underline font-medium"
                >
                  Upload first case file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className="p-2.5 rounded-lg bg-white border border-charcoal-200 hover:border-gold-400 hover:shadow-card cursor-pointer transition-all flex items-start justify-between gap-2 group"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-navy-50 text-navy-800 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-xs text-navy-900 truncate group-hover:text-gold-600 transition-colors">
                          {doc.file_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-charcoal-400">
                          <span className="font-semibold text-charcoal-600">{doc.document_category}</span>
                          <span>•</span>
                          <span>{doc.chunks_count || 0} chunks</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 text-emerald-600">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Indexed
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-navy-900 shrink-0 mt-1.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Hearing Modal */}
      {showLogHearingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-charcoal-200 p-5">
            <h3 className="font-serif font-bold text-navy-900 text-base mb-3">
              Log Hearing Order & Directions
            </h3>
            <form onSubmit={handleLogHearing} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Hearing Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">
                  Purpose / Listing Stage
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arguments on Stay Application / Final Disposal"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Judge Coram / Bench</label>
                <input
                  type="text"
                  placeholder="e.g. Hon'ble Mr. Justice Sanjeev Narula"
                  value={judgeCoram}
                  onChange={(e) => setJudgeCoram(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">
                  Order Summary / Court Direction
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize directions, undertakings, or status quo orders..."
                  value={orderSummary}
                  onChange={(e) => setOrderSummary(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">
                  Next Action Items / Compliance
                </label>
                <input
                  type="text"
                  placeholder="e.g. File rejoinder within 2 weeks; Serve advance copy"
                  value={nextActionItems}
                  onChange={(e) => setNextActionItems(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">
                  Next Date of Hearing (NDOH)
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-charcoal-200">
                <button
                  type="button"
                  onClick={() => setShowLogHearingModal(false)}
                  className="px-3 py-1.5 rounded border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-navy-900 text-white font-medium hover:bg-navy-800"
                >
                  Save Hearing Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-charcoal-200 p-5">
            <h3 className="font-serif font-bold text-navy-900 text-base mb-1">
              Upload Case Document / Pleading
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              PDFs will be parsed, checked for OCR density, and chunked along Indian legal markers into
              your private chamber store.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                >
                  <option value="PETITION">Petition / Plaint</option>
                  <option value="WRITTEN_STATEMENT">Written Statement / Reply</option>
                  <option value="BAIL_APPLICATION">Bail Application</option>
                  <option value="COURT_ORDER">Court Order / Direction</option>
                  <option value="LEGAL_NOTICE">Legal Notice / Demand</option>
                  <option value="CONTRACT">Commercial Agreement / Lease</option>
                  <option value="EVIDENCE">Evidence / Annexure</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Custom Title / File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rejoinder_Affidavit_on_Behalf_of_Petitioner.pdf"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Select PDF/DOCX File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-charcoal-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-900 hover:file:bg-navy-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-charcoal-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 rounded bg-navy-900 text-white font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {uploading ? 'Chunking & Ingesting...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
