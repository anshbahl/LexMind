import React from 'react';
import { X, Printer, Copy, Check, Clock, Calendar, CheckSquare, Sparkles, Scale } from 'lucide-react';
import { ChamberBrief } from '../../types';
import { CNRBadge } from './CNRBadge';

interface ChamberBriefModalProps {
  brief: ChamberBrief | null;
  loading?: boolean;
  onClose: () => void;
}

export const ChamberBriefModal: React.FC<ChamberBriefModalProps> = ({
  brief,
  loading = false,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!brief && !loading) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!brief) return;
    const text = `CHAMBER BRIEF: ${brief.case_title}
Forum: ${brief.court_forum}
CNR: ${brief.cnr_number || 'N/A'}
NDOH: ${brief.next_hearing_date || 'To be listed'}
Judge / Coram: ${brief.judge_coram || 'Regular Bench'}

LAST OPERATIVE COURT DIRECTION:
${brief.last_operative_court_direction}

PENDING COMPLIANCE & DEADLINES:
${brief.pending_compliance_deadlines.map((d, i) => `${i + 1}. ${d}`).join('\n')}

RECOMMENDED AGENDAS FOR NDOH:
${brief.recommended_agenda_for_ndoh.map((a, i) => `${i + 1}. ${a}`).join('\n')}

HEARING TIMELINE:
${brief.hearing_timeline
  .map(
    (h) =>
      `[${new Date(h.hearing_date).toLocaleDateString('en-IN')}] ${h.purpose} (${h.judge_coram || 'Bench'})\nOrder: ${h.order_summary}\nAction: ${h.next_action_items || 'None'}`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-charcoal-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-navy-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <div>
              <h3 className="font-serif font-bold text-sm tracking-wide">2-Minute Chamber Hearing Brief</h3>
              <p className="text-[11px] text-charcoal-300">
                Synthesis of order sheets, compliances & NDOH agenda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {brief && (
              <>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-navy-800 hover:bg-navy-700 text-charcoal-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-navy-800 hover:bg-navy-700 text-charcoal-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-navy-800 text-charcoal-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium text-navy-900">Synthesizing Chamber Brief...</p>
            </div>
          ) : brief ? (
            <div className="space-y-5 font-sans">
              {/* Matter Metadata Banner */}
              <div className="p-4 rounded-lg bg-canvas border border-charcoal-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif text-lg font-bold text-navy-900">{brief.case_title}</h4>
                  <div className="flex items-center gap-2 text-xs text-charcoal-600 mt-1">
                    <span className="font-medium text-navy-800">{brief.court_forum}</span>
                    <span>•</span>
                    <span>Coram: {brief.judge_coram || 'Regular Bench'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CNRBadge cnr={brief.cnr_number} />
                  {brief.next_hearing_date && (
                    <div className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200/70 text-xs font-medium inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>NDOH: {new Date(brief.next_hearing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Last Operative Court Direction */}
              <div>
                <h5 className="text-xs font-semibold text-charcoal-700 mb-2 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-gold-600" />
                  <span>Last Operative Court Direction</span>
                </h5>
                <div className="p-4 rounded-lg bg-gold-50/40 border border-gold-200 font-serif text-xs leading-relaxed text-charcoal-800">
                  {brief.last_operative_court_direction}
                </div>
              </div>

              {/* 2. Recommended Agenda for NDOH & Pending Deadlines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pending Compliance Deadlines */}
                <div className="p-4 rounded-lg bg-white border border-charcoal-200">
                  <h5 className="text-xs font-semibold text-charcoal-700 mb-3 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                    <span>Pending Deadlines / Compliances</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-charcoal-700">
                    {brief.pending_compliance_deadlines.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Agenda for NDOH */}
                <div className="p-4 rounded-lg bg-white border border-charcoal-200">
                  <h5 className="text-xs font-semibold text-charcoal-700 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-navy-800" />
                    <span>Recommended Agenda for NDOH</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-charcoal-700">
                    {brief.recommended_agenda_for_ndoh.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-navy-700 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Hearing History Timeline */}
              <div>
                <h5 className="text-xs font-semibold text-charcoal-700 mb-2.5">
                  Order Sheet History
                </h5>
                <div className="space-y-2.5">
                  {brief.hearing_timeline.map((hearing, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-canvas border border-charcoal-200">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-navy-900 text-xs">
                          {hearing.purpose}
                        </span>
                        <span className="text-xs text-charcoal-500 font-medium">
                          {new Date(hearing.hearing_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {hearing.judge_coram && (
                        <div className="text-[11px] text-charcoal-500 mb-1.5 italic">
                          Coram: {hearing.judge_coram}
                        </div>
                      )}
                      <p className="font-serif text-xs text-charcoal-700 leading-relaxed mb-2">
                        {hearing.order_summary}
                      </p>
                      {hearing.next_action_items && (
                        <div className="text-[11px] bg-white p-2 rounded border border-charcoal-200 text-charcoal-600">
                          <span className="font-semibold text-navy-800">Action: </span>
                          {hearing.next_action_items}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-canvas border-t border-charcoal-200 flex justify-between items-center text-xs text-charcoal-500">
          <span>Confidentially Prepared for Chamber Hearing</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white font-medium transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
};
