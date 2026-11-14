import React, { useState } from 'react';
import { Save, User, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Lawyer, DraftingStyleProfile } from '../types';

interface SettingsProps {
  lawyer: Lawyer | null;
  onUpdateLawyer: (updated: Lawyer) => void;
}

export const Settings: React.FC<SettingsProps> = ({ lawyer, onUpdateLawyer }) => {
  const [fullName, setFullName] = useState(lawyer?.full_name || '');
  const [barCouncilId, setBarCouncilId] = useState(lawyer?.bar_council_id || '');
  const [salutation, setSalutation] = useState(
    lawyer?.drafting_style_profile?.preferredSalutation || 'MOST RESPECTFULLY SHOWETH'
  );
  const [honorific, setHonorific] = useState(
    lawyer?.drafting_style_profile?.courtAddressingHonorific || 'This Hon’ble Court'
  );
  const [useNumberedParas, setUseNumberedParas] = useState(
    lawyer?.drafting_style_profile?.formattingPreferences?.useNumberedParagraphs ?? true
  );
  const [includeVerification, setIncludeVerification] = useState(
    lawyer?.drafting_style_profile?.formattingPreferences?.includeVerificationClause ?? true
  );
  const [recurringPhrases, setRecurringPhrases] = useState<string>(
    lawyer?.drafting_style_profile?.recurringPhrasing?.join(', ') ||
      'grave prejudice and irreparable injury, settled proposition of law, bona fide exercise of rights, abuse of judicial process, three-fold test of prima facie case'
  );
  const [firmHeader, setFirmHeader] = useState(
    lawyer?.drafting_style_profile?.firmHeader || 'CHAMBERS OF VIKRAMADITYA SEN, ADVOCATE | HIGH COURT OF DELHI'
  );

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(false);

    const phrasesArray = recurringPhrases
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updatedProfile: DraftingStyleProfile = {
      preferredSalutation: salutation,
      courtAddressingHonorific: honorific,
      formattingPreferences: {
        useNumberedParagraphs: useNumberedParas,
        includeVerificationClause: includeVerification,
        prayerStyle: 'traditional',
      },
      recurringPhrasing: phrasesArray,
      firmHeader,
    };

    try {
      const res = await api.auth.updateProfile({
        full_name: fullName,
        bar_council_id: barCouncilId,
        drafting_style_profile: updatedProfile,
      });
      onUpdateLawyer(res.lawyer);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-serif font-bold text-2xl text-navy-900">
          Chamber Profile & Drafting Style Settings
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Customize your personalized legal syntactic cadence, honorifics, and recurring phrasing for LexMind AI Co-Counsel.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Chamber settings and personalized drafting profile saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Advocate Details */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100">
            <User className="w-4 h-4 text-gold-500" />
            <h3 className="font-serif font-bold text-navy-900 text-base">Advocate Credentials</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">Advocate Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">
                Bar Council Enrollment ID
              </label>
              <input
                type="text"
                value={barCouncilId}
                onChange={(e) => setBarCouncilId(e.target.value)}
                placeholder="e.g. D/1429/2011"
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-charcoal-700 mb-1 text-xs">
              Chamber Letterhead Header
            </label>
            <input
              type="text"
              value={firmHeader}
              onChange={(e) => setFirmHeader(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-300 text-xs focus:outline-none focus:ring-1 focus:ring-navy-900"
            />
          </div>
        </div>

        {/* Section 2: "Draft Like Me" Personalized AI Preferences */}
        <div className="bg-white rounded-xl border border-charcoal-200 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <div>
              <h3 className="font-serif font-bold text-navy-900 text-base">
                "Draft Like Me" Stylistic Calibration
              </h3>
              <p className="text-[11px] text-charcoal-500">
                Injected into generative prompts so AI writes in your exact chamber voice
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-charcoal-700 mb-1">
                Preferred Pleading Salutation
              </label>
              <select
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 bg-white"
              >
                <option value="MOST RESPECTFULLY SHOWETH">MOST RESPECTFULLY SHOWETH</option>
                <option value="MOST RESPECTFULLY SHEWETH">MOST RESPECTFULLY SHEWETH (Archaic / High Court Tradition)</option>
                <option value="THE PETITIONER HUMBLY SUBMITS AS UNDER">THE PETITIONER HUMBLY SUBMITS AS UNDER</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-charcoal-700 mb-1">
                Court Addressing Honorific
              </label>
              <input
                type="text"
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
                placeholder="e.g. This Hon’ble Court / This Ld. Court"
                className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900"
              />
            </div>
          </div>

          {/* Recurring Phrasing */}
          <div className="text-xs">
            <label className="block font-medium text-charcoal-700 mb-1">
              Recurring Chamber Phrases (Comma Separated)
            </label>
            <textarea
              rows={3}
              value={recurringPhrases}
              onChange={(e) => setRecurringPhrases(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-charcoal-300 focus:outline-none focus:ring-1 focus:ring-navy-900 font-serif leading-relaxed"
            />
            <p className="text-[11px] text-charcoal-400 mt-1">
              Clauses like "settled proposition of law", "grave prejudice", "prima facie case" will be prioritized during drafting synthesis.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useNumberedParas}
                onChange={(e) => setUseNumberedParas(e.target.checked)}
                className="text-navy-900 rounded"
              />
              <span className="text-charcoal-700 font-medium">
                Enforce numbered legal paragraphs format (1. That..., 2. That...)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVerification}
                onChange={(e) => setIncludeVerification(e.target.checked)}
                className="text-navy-900 rounded"
              />
              <span className="text-charcoal-700 font-medium">
                Automatically append solemn affirmation deponent verification clause to petitions
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Guardrail Guarantee Notice */}
        <div className="bg-canvas rounded-xl border border-charcoal-200 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-navy-900">Strict Product Guardrail Active</h4>
            <p className="text-charcoal-500 mt-0.5 leading-relaxed">
              LexMind strictly prohibits outcome probability scoring or win/loss percentages. Your data is isolated at the SQL level via tenant ID filtering on all embeddings and relations.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4 text-gold-400" />
            <span>{saving ? 'Saving...' : 'Save Chamber Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
