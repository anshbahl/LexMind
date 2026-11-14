import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Plus,
  Scale,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { Lawyer, Case } from '../types';
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

  const getDaysRemainingText = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Listed Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Listed Past';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* 1. Serene Advocate Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-charcoal-200/70">
        <div>
          <div className="text-xs font-medium text-gold-600 uppercase tracking-widest font-sans mb-1">
            Chambers Practice Desk • Delhi Bar
          </div>
          <h1 className="font-serif font-bold text-2xl text-navy-900">
            {lawyer?.full_name || 'Adv. Vikramaditya Sen'}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            High Court of Delhi & Supreme Court of India • Bar Council No. {lawyer?.bar_council_id || 'D/1429/2011'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/precedents')}
            className="px-3.5 py-2 rounded-md bg-white hover:bg-charcoal-50 border border-charcoal-300 text-xs font-medium text-navy-900 inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-gold-500" />
            <span>Search Precedents</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Matter</span>
          </button>
        </div>
      </div>

      {/* 2. Three Calm Practice Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg border border-charcoal-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Matters</span>
            <Briefcase className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-3xl font-serif font-bold text-navy-900">
            {stats?.activeCases ?? 4}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Across Civil, Criminal, Writ & Commercial jurisdictions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-charcoal-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Hearings</span>
            <Calendar className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-gold-600">
            {stats?.upcomingHearingsCount ?? 4}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Next listing: {cases[0]?.case_title ? cases[0].case_title.split('v.')[0] + 'v. State' : 'Verma v. State'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-charcoal-200/80 p-5 shadow-card">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chamber Archive</span>
            <FileText className="w-4 h-4 text-navy-700" />
          </div>
          <div className="text-3xl font-serif font-bold text-navy-900">
            {stats?.totalDocuments ?? 4} Files
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Pleadings & orders indexed for personalized drafting
          </p>
        </div>
      </div>

      {/* 3. Cause List & Hearing Board */}
      <div className="bg-white rounded-lg border border-charcoal-200/80 shadow-card overflow-hidden">
        <div className="p-5 border-b border-charcoal-200/70 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-navy-900">Cause List & Hearing Board</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Next dates of hearing, coram directives, and 1-click chamber briefs
            </p>
          </div>
          <Link
            to="/cases"
            className="text-xs font-medium text-navy-900 hover:text-gold-600 inline-flex items-center gap-1 transition-colors"
          >
            <span>View All Matters</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-charcoal-100">
          {cases.length === 0 ? (
            <div className="p-8 text-center text-charcoal-400 text-xs">
              <p>No upcoming listings on the board.</p>
            </div>
          ) : (
            cases.map((c) => {
              const countdown = getDaysRemainingText(c.next_hearing_date);

              return (
                <div
                  key={c.id}
                  className="p-5 hover:bg-canvas/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <CaseTypeBadge type={c.case_type} />
                      <CNRBadge cnr={c.cnr_number} />
                      {c.next_hearing_date && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/60 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>
                            {new Date(c.next_hearing_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            • {countdown}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-bold text-base text-navy-900 hover:text-gold-600 transition-colors">
                      <Link to={`/cases/${c.id}`}>{c.case_title}</Link>
                    </h3>

                    {/* Forum & Client */}
                    <div className="text-xs text-charcoal-500 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-charcoal-700">{c.court_forum}</span>
                      <span>•</span>
                      <span>Client: {c.client_name}</span>
                    </div>

                    {/* Last order preview */}
                    {c.outcome_summary && (
                      <p className="text-xs text-charcoal-600 italic line-clamp-1 pt-0.5">
                        Directive: {c.outcome_summary}
                      </p>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleOpenBrief(c.id)}
                      className="px-3 py-1.5 rounded-md bg-gold-50 hover:bg-gold-100 text-gold-700 border border-gold-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      title="Generate 2-Minute Chamber Brief for court appearance"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                      <span>2-Min Brief</span>
                    </button>
                    <Link
                      to={`/cases/${c.id}`}
                      className="px-3.5 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Drafting Desk</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create New Matter Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-charcoal-200 p-6">
            <h3 className="font-serif font-bold text-navy-900 text-lg mb-1">
              Open New Matter File
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              Enter matter details to create a dedicated dossier and drafting workspace.
            </p>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 mb-1">Matter Title</label>
                <input
                  type="text"
                  placeholder="e.g. Verma v. State of NCT of Delhi & Anr."
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
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
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
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
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
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
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 mb-1">Jurisdiction Type</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white"
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
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
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
                    className="w-full px-3 py-2 rounded-md border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-charcoal-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-md border border-charcoal-300 text-charcoal-600 hover:bg-charcoal-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-navy-900 text-white font-medium hover:bg-navy-800"
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
