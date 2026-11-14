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
    <div className="h-full flex flex-col bg-canvas select-none">
      {/* 1. Case Details Header */}
      <div className="p-4 bg-white border-b border-charcoal-200/70 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-charcoal-700 truncate">
            {caseData.court_forum}
          </span>
          <span className="text-[11px] font-medium text-charcoal-500">
            {caseData.status}
          </span>
        </div>

        <h2 className="font-serif font-bold text-navy-900 text-sm leading-snug">
          {caseData.case_title}
        </h2>

        <div className="text-xs text-charcoal-500 pt-1 border-t border-charcoal-100 flex flex-col gap-0.5">
          <div className="truncate">
            <span className="text-charcoal-400">Client:</span>{' '}
            <span className="font-medium text-charcoal-700">{caseData.client_name}</span>
          </div>
          <div className="truncate">
            <span className="text-charcoal-400">Opposing:</span>{' '}
            <span className="font-medium text-charcoal-700">{caseData.opposing_party}</span>
          </div>
        </div>

        {caseData.next_hearing_date && (
          <div className="pt-1.5 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Next Hearing (NDOH):</span>
            <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
              {new Date(caseData.next_hearing_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* 2. Segmented Tab Switcher */}
      <div className="flex bg-canvas border-b border-charcoal-200/70 text-xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2.5 text-center font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'text-navy-900 font-semibold border-b-2 border-navy-900 bg-white'
              : 'text-charcoal-500 hover:text-navy-900'
          }`}
        >
          Hearings ({hearings.length})
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-center font-medium transition-colors ${
            activeTab === 'files'
              ? 'text-navy-900 font-semibold border-b-2 border-navy-900 bg-white'
              : 'text-charcoal-500 hover:text-navy-900'
          }`}
        >
          Case Files ({documents.length})
        </button>
      </div>

      {/* 3. Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'timeline' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-600">Hearing Diary</span>
              <button
                onClick={() => setShowLogHearingModal(true)}
                className="text-xs text-navy-900 hover:text-gold-600 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Order</span>
              </button>
            </div>

            {hearings.length === 0 ? (
              <div className="py-10 text-center text-charcoal-400 text-xs">
                <Clock className="w-7 h-7 mx-auto mb-2 text-charcoal-300" />
                <p>No hearing orders logged yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hearings.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-lg bg-white border border-charcoal-200/70 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-navy-900 truncate">{h.purpose}</span>
                      <span className="text-[11px] text-charcoal-500 font-medium">
                        {new Date(h.hearing_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    {h.judge_coram && (
                      <div className="text-[11px] text-charcoal-500 italic truncate">
                        Coram: {h.judge_coram}
                      </div>
                    )}

                    <p className="font-serif text-xs text-charcoal-700 leading-relaxed line-clamp-3">
                      {h.order_summary}
                    </p>

                    {h.next_action_items && (
                      <div className="pt-1.5 border-t border-charcoal-100 text-[11px] text-charcoal-600 flex items-start gap-1">
                        <span className="font-semibold text-navy-900 shrink-0">Action:</span>
                        <span className="truncate">{h.next_action_items}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-charcoal-600">Case Documents</span>
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs text-navy-900 hover:text-gold-600 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-10 text-center text-charcoal-400 text-xs">
                <Folder className="w-7 h-7 mx-auto mb-2 text-charcoal-300" />
                <p>No pleadings or orders uploaded.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className="p-3 rounded-lg bg-white border border-charcoal-200/70 hover:border-gold-400 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-navy-700 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-xs text-navy-900 truncate group-hover:text-gold-600 transition-colors">
                          {doc.file_name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-charcoal-400">
                          <span>{doc.document_category}</span>
                          <span>•</span>
                          <span>{doc.page_count} pages</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-navy-900 shrink-0" />
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
              Record Hearing Order
            </h3>
            <form onSubmit={handleLogHearing} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Hearing Date</label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Listing Stage / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Arguments on Stay Application"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Judge Coram / Bench</label>
                <input
                  type="text"
                  placeholder="e.g. Hon'ble Mr. Justice Sanjeev Narula"
                  value={judgeCoram}
                  onChange={(e) => setJudgeCoram(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Court Direction / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Summarize directions issued, status quo orders, or undertakings..."
                  value={orderSummary}
                  onChange={(e) => setOrderSummary(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none font-serif"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Action Items / Compliance</label>
                <input
                  type="text"
                  placeholder="e.g. File rejoinder within 2 weeks"
                  value={nextActionItems}
                  onChange={(e) => setNextActionItems(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Next Date of Hearing (NDOH)</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-charcoal-200">
                <button
                  type="button"
                  onClick={() => setShowLogHearingModal(false)}
                  className="px-3 py-1.5 rounded-md border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-navy-900 text-white font-medium hover:bg-navy-800"
                >
                  Save Log
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
              Add Case Pleading or Order
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              Files will be stored securely in your private chamber store.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white"
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
                <label className="block font-medium text-charcoal-700 mb-1">Custom File Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rejoinder_Affidavit_on_Behalf_of_Petitioner.pdf"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Select File (.pdf, .docx, .txt)</label>
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
                  className="px-3 py-1.5 rounded-md border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 rounded-md bg-navy-900 text-white font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {uploading ? 'Processing File...' : 'Upload & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
