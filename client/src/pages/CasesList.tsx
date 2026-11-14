import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Case, CaseType, CaseStatus } from '../types';
import { CNRBadge } from '../components/common/CNRBadge';
import { CaseTypeBadge } from '../components/common/CaseTypeBadge';
import { ChamberBriefModal } from '../components/common/ChamberBriefModal';

export const CasesList: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Chamber Brief Modal
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [courtForum, setCourtForum] = useState('High Court of Delhi');
  const [caseType, setCaseType] = useState<CaseType>('CIVIL');
  const [cnrNumber, setCnrNumber] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.cases.list({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        case_type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setCases(res.cases);
    } catch (err: any) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, typeFilter, searchQuery]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.cases.create({
        case_title: caseTitle,
        client_name: clientName,
        opposing_party: opposingParty,
        court_forum: courtForum,
        case_type: caseType,
        cnr_number: cnrNumber || undefined,
        next_hearing_date: nextHearingDate || undefined,
        status: 'ACTIVE',
      });
      setShowCreateModal(false);
      navigate(`/cases/${res.case.id}`);
    } catch (err: any) {
      alert(`Failed to create matter: ${err.message}`);
    }
  };

  const handleOpenBrief = async (caseId: string) => {
    setLoadingBrief(true);
    setSelectedBrief(null);
    try {
      const res = await api.cases.getChamberBrief(caseId);
      setSelectedBrief(res.brief);
    } catch (err: any) {
      alert(`Failed to generate brief: ${err.message}`);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-navy-900">Chamber Matters & Case Files</h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Active litigations, pleadings, hearings & private precedent knowledge stores
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Matter</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-charcoal-200 p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] relative">
          <input
            type="text"
            placeholder="Search by title, client, opposing party, or CNR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
          />
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-charcoal-100 p-1 rounded-lg text-xs font-medium">
            {['ALL', 'ACTIVE', 'DISPOSED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === s ? 'bg-white text-navy-900 font-semibold shadow-sm' : 'text-charcoal-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs text-charcoal-700 bg-white focus:outline-none focus:ring-1 focus:ring-navy-900"
          >
            <option value="ALL">All Jurisdictions</option>
            <option value="CIVIL">Civil</option>
            <option value="CRIMINAL">Criminal</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="WRIT">Writ</option>
            <option value="ARBITRATION">Arbitration</option>
            <option value="FAMILY">Family</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-charcoal-400">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading chamber matters...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="col-span-full py-16 text-center text-charcoal-400 bg-white rounded-xl border border-charcoal-200">
            <Briefcase className="w-10 h-10 mx-auto mb-2 text-charcoal-300" />
            <h4 className="text-sm font-semibold text-navy-900">No matching cases found</h4>
            <p className="text-xs text-charcoal-500 mt-1">Try resetting your filters or create a new matter.</p>
          </div>
        ) : (
          cases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-charcoal-200 p-5 shadow-card hover:shadow-editor hover:border-gold-400 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CaseTypeBadge type={c.case_type} />
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-charcoal-100 text-charcoal-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Case Title */}
                <h3 className="font-serif font-bold text-navy-900 text-base leading-snug line-clamp-2 group-hover:text-gold-600 transition-colors">
                  <Link to={`/cases/${c.id}`}>{c.case_title}</Link>
                </h3>

                <p className="text-xs text-charcoal-500 mt-1 font-medium truncate">{c.court_forum}</p>

                {/* CNR & NDOH */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-charcoal-100">
                  <CNRBadge cnr={c.cnr_number} />
                  {c.next_hearing_date && (
                    <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>{new Date(c.next_hearing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </span>
                  )}
                </div>

                {/* Parties Details */}
                <div className="mt-3 text-xs space-y-1 bg-canvas p-2.5 rounded-lg border border-charcoal-100">
                  <div className="truncate">
                    <span className="font-semibold text-charcoal-600">Client: </span>
                    <span className="text-navy-900">{c.client_name}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-charcoal-600">Opposing: </span>
                    <span className="text-navy-900">{c.opposing_party}</span>
                  </div>
                </div>

                {/* Outcome snippet */}
                {c.outcome_summary && (
                  <p className="mt-3 text-xs italic text-charcoal-600 line-clamp-2">
                    "{c.outcome_summary}"
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-charcoal-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-charcoal-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{c.hearings_count || 0} Hearings</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{c.documents_count || 0} Docs</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenBrief(c.id)}
                    className="p-1.5 rounded text-gold-600 hover:bg-gold-50 transition-colors"
                    title="2-Min Chamber Brief"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/cases/${c.id}`}
                    className="px-3 py-1.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Drafting</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-charcoal-200 p-6">
            <h3 className="font-serif font-bold text-navy-900 text-lg mb-1">
              Create New Legal Matter
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              Enter case details to initiate the Matter Workspace and ground drafting in historical chamber files.
            </p>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Case Title</label>
                <input
                  type="text"
                  placeholder="e.g. Verma v. State of NCT of Delhi & Anr."
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajeev Verma"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Opposing Party</label>
                  <input
                    type="text"
                    placeholder="e.g. State & Ashok Singhania"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Court Forum</label>
                  <input
                    type="text"
                    placeholder="e.g. High Court of Delhi"
                    value={courtForum}
                    onChange={(e) => setCourtForum(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Matter Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white"
                  >
                    <option value="CIVIL">CIVIL</option>
                    <option value="CRIMINAL">CRIMINAL</option>
                    <option value="WRIT">WRIT</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="FAMILY">FAMILY</option>
                    <option value="ARBITRATION">ARBITRATION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">
                    CNR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DLHC010045212025"
                    value={cnrNumber}
                    onChange={(e) => setCnrNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">
                    Next Date of Hearing (NDOH)
                  </label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-charcoal-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-navy-900 text-white font-medium hover:bg-navy-800"
                >
                  Create Matter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chamber Brief Modal */}
      <ChamberBriefModal
        brief={selectedBrief}
        loading={loadingBrief}
        onClose={() => setSelectedBrief(null)}
      />
    </div>
  );
};
