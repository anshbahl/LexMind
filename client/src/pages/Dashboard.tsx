import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  FileText,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Scale,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { Lawyer, Case, Hearing } from '../types';
import { CNRBadge } from '../components/common/CNRBadge';
import { CaseTypeBadge } from '../components/common/CaseTypeBadge';
import { ChamberBriefModal } from '../components/common/ChamberBriefModal';

interface DashboardProps {
  lawyer: Lawyer | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ lawyer }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);

  // Chamber brief modal state
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  // New Matter Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [courtForum, setCourtForum] = useState('High Court of Delhi');
  const [caseType, setCaseType] = useState('CIVIL');
  const [cnrNumber, setCnrNumber] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, casesRes] = await Promise.all([
        api.cases.getOverviewStats(),
        api.cases.list(),
      ]);
      setStats(statsRes);
      setCases(casesRes.cases);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.cases.create({
        case_title: caseTitle,
        client_name: clientName,
        opposing_party: opposingParty,
        court_forum: courtForum,
        case_type: caseType as any,
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
      {/* 1. Advocate Header Banner */}
      <div className="bg-white rounded-xl border border-charcoal-200 p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-600 font-sans">
              Chamber Practice OS
            </span>
            <span className="text-charcoal-300">•</span>
            <span className="text-xs text-charcoal-500 font-mono">
              Bar Council No. {lawyer?.bar_council_id || 'D/1429/2011'}
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-navy-900">
            {lawyer?.full_name || 'Adv. Vikramaditya Sen'}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Advocate on Record • High Court of Delhi & Supreme Court of India
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/precedents')}
            className="px-3.5 py-2 rounded-lg bg-canvas hover:bg-charcoal-100 border border-charcoal-200 text-xs font-semibold text-navy-900 inline-flex items-center gap-2 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-gold-500" />
            <span>Search Precedents</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Matter</span>
          </button>
        </div>
      </div>

      {/* 2. Practice Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Active Matters
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-navy-900">
              {stats?.activeCases ?? 4}
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              {stats?.totalCases ?? 4} total registered in chamber
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Upcoming Hearings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-800">
              {stats?.upcomingHearingsCount ?? 4}
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              Scheduled listings within 30 days
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Chamber Files Indexed
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-sky-900">
              {stats?.totalDocuments ?? 4}
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">Pleadings, orders & legal notices</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Precedent Store
            </span>
            <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-navy-900">
              {stats?.totalChunksIndexed ?? 12}
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              768-dim pgvector knowledge embeddings
            </p>
          </div>
        </div>
      </div>

      {/* 3. Cause List / Upcoming Hearings Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-charcoal-200 flex items-center justify-between bg-canvas/40">
          <div>
            <h3 className="font-serif font-bold text-navy-900 text-base">Cause List & Upcoming Hearings</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Next Dates of Hearing (NDOH) with bench coram & pending directions
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="text-xs font-semibold text-navy-900 hover:text-gold-600 inline-flex items-center gap-1 transition-colors"
          >
            <span>View All Matters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-charcoal-100 overflow-x-auto">
          {cases.length === 0 ? (
            <div className="py-12 text-center text-charcoal-400 text-xs">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
              <p>No hearings listed yet.</p>
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                className="p-4 hover:bg-canvas/50 transition-colors flex flex-wrap items-center justify-between gap-4"
              >
                {/* Matter Details */}
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-1">
                    <CaseTypeBadge type={c.case_type} />
                    <CNRBadge cnr={c.cnr_number} />
                    {c.next_hearing_date && (
                      <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        NDOH: {new Date(c.next_hearing_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-navy-900 text-sm hover:text-gold-600 transition-colors">
                    <Link to={`/cases/${c.id}`}>{c.case_title}</Link>
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-1">
                    <span>{c.court_forum}</span>
                    <span>•</span>
                    <span className="text-charcoal-600">Client: {c.client_name}</span>
                  </div>
                </div>

                {/* Outcome / Notes snippet */}
                {c.outcome_summary && (
                  <div className="max-w-xs text-xs text-charcoal-600 italic bg-canvas p-2 rounded border border-charcoal-200 line-clamp-2">
                    "{c.outcome_summary}"
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBrief(c.id)}
                    className="px-3 py-1.5 rounded bg-gold-50 hover:bg-gold-100 text-gold-700 border border-gold-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    title="Generate 2-Minute Chamber Brief"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                    <span>2-Min Brief</span>
                  </button>
                  <Link
                    to={`/cases/${c.id}`}
                    className="px-3 py-1.5 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Portfolio Breakdown: Court Forums & Matter Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forum Distribution */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Building className="w-4 h-4 text-gold-500" />
            <h4 className="font-serif font-bold text-navy-900 text-sm">
              Practice Across Indian Courts & Forums
            </h4>
          </div>
          <div className="space-y-2.5">
            {stats?.forumDistribution?.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-charcoal-700 font-medium">{f.court_forum}</span>
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-700">
                  {f.count} matters
                </span>
              </div>
            )) || (
              <p className="text-xs text-charcoal-400">Loading forum breakdown...</p>
            )}
          </div>
        </div>

        {/* Case Type Distribution */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-gold-500" />
            <h4 className="font-serif font-bold text-navy-900 text-sm">Matter Classification</h4>
          </div>
          <div className="space-y-2.5">
            {stats?.typeDistribution?.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <CaseTypeBadge type={t.case_type} />
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-700">
                  {t.count} cases
                </span>
              </div>
            )) || (
              <p className="text-xs text-charcoal-400">Loading classification breakdown...</p>
            )}
          </div>
        </div>
      </div>

      {/* Create New Matter Modal */}
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
                    onChange={(e) => setCaseType(e.target.value)}
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

      {/* 2-Min Chamber Brief Modal */}
      <ChamberBriefModal
        brief={selectedBrief}
        loading={loadingBrief}
        onClose={() => setSelectedBrief(null)}
      />
    </div>
  );
};
