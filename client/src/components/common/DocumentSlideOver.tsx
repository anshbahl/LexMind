import React, { useEffect, useState } from 'react';
import { X, FileText, CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { CaseDocument, DocumentChunk } from '../../types';

interface DocumentSlideOverProps {
  documentId: string | null;
  highlightChunkId?: string | null;
  onClose: () => void;
}

export const DocumentSlideOver: React.FC<DocumentSlideOverProps> = ({
  documentId,
  highlightChunkId,
  onClose,
}) => {
  const [docData, setDocData] = useState<{ document: CaseDocument; chunks: DocumentChunk[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocData(null);
      return;
    }

    setLoading(true);
    api.documents
      .getChunks(documentId)
      .then((res) => {
        setDocData(res);
      })
      .catch((err) => {
        console.error('Failed to load document chunks:', err);
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) return null;

  const handleCopy = (chunkId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(chunkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-950/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-charcoal-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-charcoal-200 bg-canvas flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900 text-gold-500 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 text-sm tracking-tight truncate max-w-md">
                {docData?.document.file_name || 'Loading Document...'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-charcoal-500">
                <span>Category: {docData?.document.document_category}</span>
                <span>•</span>
                <span>{docData?.document.page_count || 1} Pages</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OCR Verified
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-charcoal-200 text-charcoal-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chunks content stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-charcoal-400">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Loading indexed chamber clauses...</p>
            </div>
          ) : !docData || docData.chunks.length === 0 ? (
            <div className="py-20 text-center text-charcoal-400">
              <p className="text-sm">No indexed chunks found for this document.</p>
            </div>
          ) : (
            docData.chunks.map((chunk) => {
              const isTarget = highlightChunkId === chunk.id;
              return (
                <div
                  key={chunk.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isTarget
                      ? 'border-gold-500 bg-gold-50/50 shadow-md ring-1 ring-gold-500'
                      : 'border-charcoal-200 bg-white hover:border-charcoal-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-navy-50 text-navy-800 border border-navy-100">
                        § {chunk.section_type}
                      </span>
                      <span className="text-[11px] text-charcoal-400 font-mono">
                        Clause #{chunk.chunk_index + 1}
                      </span>
                      {isTarget && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gold-500 text-white">
                          Cited Reference
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(chunk.id, chunk.content)}
                      className="text-xs text-charcoal-500 hover:text-navy-900 inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedId === chunk.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Clause</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-serif text-sm leading-relaxed text-charcoal-800 whitespace-pre-wrap select-text">
                    {chunk.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-charcoal-200 bg-canvas text-xs text-charcoal-500 flex justify-between items-center">
          <span>Grounded chamber archive • Strict lawyer isolation enforced</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-navy-900 bg-white border border-charcoal-300 rounded hover:bg-charcoal-50"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
